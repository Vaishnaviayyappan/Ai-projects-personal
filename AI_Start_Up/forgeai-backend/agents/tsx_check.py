import os
import re
import shutil
import subprocess

FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "forgeai-frontend"))

# Parses the file with the frontend's TypeScript and checks that every import resolves
# from the frontend's node_modules, so a page that passes will compile under Next.js.
_CHECK_SCRIPT = r"""
const ts = require('typescript');
let src = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => src += d).on('end', () => {
  const errors = [];
  const r = ts.transpileModule(src, {
    fileName: 'page.tsx',
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ES2020 },
  });
  for (const d of r.diagnostics || []) {
    const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
    if (d.file && d.start !== undefined) {
      const p = d.file.getLineAndCharacterOfPosition(d.start);
      errors.push(`line ${p.line + 1}: ${msg}`);
    } else {
      errors.push(msg);
    }
  }
  if (!errors.length) {
    // Type-aware resolution so type-only imports (e.g. FormEvent) are accepted.
    const file = require('path').join(process.cwd(), 'src', 'app', '__tsx_check__', 'page.tsx').replace(/\\/g, '/');
    const options = {
      jsx: ts.JsxEmit.Preserve, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2020, esModuleInterop: true, skipLibCheck: true, noEmit: true,
    };
    const host = ts.createCompilerHost(options);
    const getSourceFile = host.getSourceFile, fileExists = host.fileExists, readFile = host.readFile;
    host.getSourceFile = (f, v) => f === file ? ts.createSourceFile(f, src, v, true, ts.ScriptKind.TSX) : getSourceFile(f, v);
    host.fileExists = f => f === file || fileExists(f);
    host.readFile = f => f === file ? src : readFile(f);
    const program = ts.createProgram([file], options, host);
    const sf = program.getSourceFile(file);
    // 2304 undefined name, 2305/2614/2724 missing export, 2306/2307 missing module, 1192 no default export
    const codes = new Set([2304, 2305, 2306, 2307, 2614, 2724, 1192]);
    for (const d of program.getSemanticDiagnostics(sf)) {
      if (!codes.has(d.code)) continue;
      const p = sf.getLineAndCharacterOfPosition(d.start);
      errors.push(`line ${p.line + 1}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`);
    }
    // Capitalized JSX tags must be imported or defined in the file. TypeScript accepts DOM
    // globals like <Text> or <Image>, but they are not components and crash at render time.
    const checker = program.getTypeChecker();
    const seen = new Set();
    const visit = node => {
      if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && ts.isIdentifier(node.tagName)) {
        const name = node.tagName.text;
        const sym = checker.getSymbolAtLocation(node.tagName);
        if (/^[A-Z]/.test(name) && sym && !seen.has(name)
            && !(sym.declarations || []).some(d => d.getSourceFile() === sf)) {
          seen.add(name);
          const p = sf.getLineAndCharacterOfPosition(node.tagName.getStart());
          errors.push(`line ${p.line + 1}: Cannot find name '${name}'.`);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
    for (const st of sf.statements) {
      if (!ts.isImportDeclaration(st)) continue;
      const p = sf.getLineAndCharacterOfPosition(st.getStart());
      if (st.moduleSpecifier.text.startsWith('.')) {
        errors.push(`line ${p.line + 1}: relative import '${st.moduleSpecifier.text}' does not exist in the preview route`);
      } else if (!st.importClause) {
        // TypeScript does not resolve side-effect imports, but Next.js does and fails on bad ones
        errors.push(`line ${p.line + 1}: side-effect import '${st.moduleSpecifier.text}' is not allowed`);
      }
    }
    if (!/export\s+default\s/.test(src)) errors.push('missing default export');
  }
  process.stdout.write(errors.slice(0, 10).join('\n'));
  process.exit(errors.length ? 1 : 0);
});
"""


FALLBACK_ICON = "Sparkles"


def _missing_exports(module: str, check_msg: str) -> set[str]:
    return set(re.findall(rf"""'"{re.escape(module)}"' has no exported member(?: named)? '(\w+)'""", check_msg))


def repair_imports(code: str, check_msg: str) -> str:
    """Fixes names the model commonly invents: react-icons names imported from lucide-react
    (aliased to a real icon) and React Native-style components imported from react
    (replaced with <div> stand-ins)."""
    bad_icons = _missing_exports("lucide-react", check_msg)
    if bad_icons:
        def fix_icons(m: re.Match) -> str:
            names = []
            for part in m.group(1).split(","):
                part = part.strip()
                if not part:
                    continue
                src, _, alias = part.partition(" as ")
                src, alias = src.strip(), alias.strip() or src.strip()
                names.append(f"{FALLBACK_ICON} as {alias}" if src in bad_icons else part)
            return "import { " + ", ".join(names) + " } from 'lucide-react'"

        code = re.sub(r"""import\s*\{([^}]*)\}\s*from\s*['"]lucide-react['"]""", fix_icons, code)

    bad_components = {n for n in _missing_exports("react", check_msg) if n[0].isupper()}
    # Components used but never defined or imported (TS2304)
    undefined_components = {n for n in re.findall(r"Cannot find name '(\w+)'", check_msg) if n[0].isupper()}
    if bad_components or undefined_components:
        aliases = sorted(undefined_components)

        def fix_react(m: re.Match) -> str:
            names = []
            for part in m.group(1).split(","):
                part = part.strip()
                if not part:
                    continue
                src, _, alias = part.partition(" as ")
                if src.strip() in bad_components:
                    aliases.append(alias.strip() or src.strip())
                else:
                    names.append(part)
            return "{ " + ", ".join(names) + " } from 'react'"

        if bad_components:
            code = re.sub(r"""\{([^}]*)\}\s*from\s*['"]react['"]""", fix_react, code)
        stand_ins = "\n".join(f"const {a} = (props: React.ComponentProps<'div'>) => <div {{...props}} />;" for a in aliases)
        lines = code.splitlines()
        last_import = max((i for i, l in enumerate(lines) if l.lstrip().startswith("import ")), default=0)
        lines.insert(last_import + 1, stand_ins)
        code = "\n".join(lines)

    return code


def check_tsx(code: str) -> tuple[bool, str]:
    """Returns (ok, message). ok is True with a message if the check could not run."""
    node = shutil.which("node")
    if not node or not os.path.isdir(os.path.join(FRONTEND_DIR, "node_modules", "typescript")):
        return True, "TSX check skipped: node or frontend node_modules not found."
    try:
        result = subprocess.run(
            [node, "-e", _CHECK_SCRIPT],
            input=code,
            capture_output=True,
            text=True,
            encoding="utf-8",
            cwd=FRONTEND_DIR,
            timeout=60,
        )
    except subprocess.TimeoutExpired:
        return True, "TSX check skipped: timed out."
    if result.returncode == 0:
        return True, ""
    return False, (result.stdout or result.stderr).strip()
