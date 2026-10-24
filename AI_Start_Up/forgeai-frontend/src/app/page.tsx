"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  Cpu,
  Globe,
  Zap,
  Terminal,
  Layers,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Sparkles,
  Code2,
  Database,
  BarChart3,
  ChevronDown,
  Download,
  TrendingUp,
  FileCode,
} from "lucide-react";

const STEPS = [
  { id: "research", name: "Market Research", icon: Globe, statusKey: "research" },
  { id: "validation", name: "Validation", icon: CheckCircle2, statusKey: "validation" },
  { id: "prd", name: "Architecture", icon: Layers, statusKey: "prd" },
  { id: "engineering", name: "Backend Dev", icon: Database, statusKey: "backend" },
  { id: "generation", name: "Frontend Forge", icon: Code2, statusKey: "mvp" },
  { id: "launch", name: "GTM Strategy", icon: Rocket, statusKey: "launch" },
];

const RESULT_TABS = [
  { id: "blueprint", label: "Blueprint", icon: BarChart3 },
  { id: "market", label: "Research", icon: Globe },
  { id: "competitors", label: "Competitors", icon: TrendingUp },
  { id: "pitch", label: "Pitch Deck", icon: Sparkles },
  { id: "growth", label: "Growth", icon: Rocket },
  { id: "code", label: "API Code", icon: FileCode },
  { id: "schema", label: "DB Schema", icon: Database },
];

interface RunResults {
  prd?: string;
  marketResearch?: string;
  validationAnalysis?: string;
  validationScore?: number;
  competitorAnalysis?: string;
  uiUxSystem?: string;
  backendArchitecture?: string;
  generatedBackendCode?: string;
  generatedDbSchema?: string;
  pitchDeck?: string;
  investorOutreach?: string;
  launchStrategy?: string;
}

export default function Home() {
  const [idea, setIdea] = useState("");
  const [targetUsers, setTargetUsers] = useState("");
  const [market, setMarket] = useState("");
  const [businessModel, setBusinessModel] = useState("");
  const [teamAndBudget, setTeamAndBudget] = useState("");
  const [startupGoal, setStartupGoal] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isBuilding, setIsBuilding] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("");
  const [results, setResults] = useState<RunResults>({});
  const [activeTab, setActiveTab] = useState("blueprint");
  const [isDeploying, setIsDeploying] = useState(false);

  const logContainerRef = useRef<HTMLDivElement>(null);

  // Scroll only the log panel (not the window) and only when new lines arrive
  useEffect(() => {
    const el = logContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs.length]);

  const startBuild = async () => {
    if (!idea.trim()) return;
    setIsBuilding(true);
    setResults({});
    setActiveTab("blueprint");
    setLogs(["Initiating neural sync...", "Connecting to ForgeAI Orchestrator (Port 8000)..."]);

    try {
      const res = await fetch("http://localhost:8000/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea,
          target_users: targetUsers,
          market,
          business_model: businessModel,
          team_and_budget: teamAndBudget,
          startup_goal: startupGoal,
        }),
      });
      const data = await res.json();
      if (data.project_id) {
        setProjectId(data.project_id);
      } else {
        setLogs((prev) => [...prev, "❌ Failed to initialize pipeline."]);
        setIsBuilding(false);
      }
    } catch {
      setLogs((prev) => [...prev, "❌ API Error: Ensure backend is running on port 8000."]);
      setIsBuilding(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (projectId && isBuilding) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`http://localhost:8000/api/status/${projectId}`);
          const data = await res.json();
          if (data.logs) setLogs((prev) => (prev.length === data.logs.length ? prev : data.logs));
          if (data.status) setStatus(data.status);
          setResults((prev) => ({
            ...prev,
            ...(data.prd && { prd: data.prd }),
            ...(data.market_research && { marketResearch: data.market_research }),
            ...(data.validation_analysis && { validationAnalysis: data.validation_analysis }),
            ...(data.validation_score !== undefined && { validationScore: data.validation_score }),
            ...(data.competitor_analysis && { competitorAnalysis: data.competitor_analysis }),
            ...(data.ui_ux_system && { uiUxSystem: data.ui_ux_system }),
            ...(data.backend_architecture && { backendArchitecture: data.backend_architecture }),
            ...(data.generated_backend_code && { generatedBackendCode: data.generated_backend_code }),
            ...(data.generated_db_schema && { generatedDbSchema: data.generated_db_schema }),
            ...(data.pitch_deck && { pitchDeck: data.pitch_deck }),
            ...(data.investor_outreach && { investorOutreach: data.investor_outreach }),
            ...(data.launch_strategy && { launchStrategy: data.launch_strategy }),
          }));
          if (data.status === "completed" || data.status === "failed") {
            setIsBuilding(false);
            clearInterval(interval);
          }
        } catch {
          console.error("Polling error");
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [projectId, isBuilding]);

  const handleDeploy = async () => {
    if (!projectId) return;
    setIsDeploying(true);
    const newWindow = window.open("about:blank", "_blank");
    try {
      const res = await fetch(`http://localhost:8000/api/deploy/${projectId}`, { method: "POST" });
      const data = await res.json();
      if (data.url && newWindow) {
        newWindow.location.href = data.url;
      } else {
        newWindow?.close();
        alert(data.error || "Failed to deploy.");
      }
    } catch {
      newWindow?.close();
      alert("Deployment API error.");
    } finally {
      setIsDeploying(false);
    }
  };

  const handleExport = () => {
    const blob = new Blob(
      [JSON.stringify({ projectId, idea, generatedAt: new Date().toISOString(), outputs: results }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forgeai-blueprint-${projectId?.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCurrentStepIndex = () => {
    if (!status) return -1;
    if (status === "completed") return STEPS.length;
    return STEPS.findIndex((step) => status.toLowerCase().includes(step.statusKey));
  };

  const currentStepIndex = getCurrentStepIndex();

  const getTabContent = (): string | undefined => {
    switch (activeTab) {
      case "blueprint":
        return results.prd;
      case "market":
        return [results.marketResearch, results.validationAnalysis].filter(Boolean).join("\n\n---\n\n") || undefined;
      case "competitors":
        return results.competitorAnalysis;
      case "pitch":
        return [results.pitchDeck, results.investorOutreach].filter(Boolean).join("\n\n---\n\n") || undefined;
      case "growth":
        return results.launchStrategy;
      case "code":
        return results.generatedBackendCode
          ? `# Backend Architecture\n\n${results.backendArchitecture ?? ""}\n\n---\n\`\`\`python\n${results.generatedBackendCode}\n\`\`\``
          : undefined;
      case "schema":
        return results.generatedDbSchema ? `\`\`\`sql\n${results.generatedDbSchema}\n\`\`\`` : undefined;
      default:
        return undefined;
    }
  };

  const tabContent = getTabContent();

  const advancedFields = [
    { label: "Target Users", value: targetUsers, onChange: setTargetUsers, placeholder: "e.g. indie hackers, SMBs" },
    { label: "Market", value: market, onChange: setMarket, placeholder: "e.g. B2B SaaS, Consumer" },
    { label: "Business Model", value: businessModel, onChange: setBusinessModel, placeholder: "e.g. subscription, freemium" },
    { label: "Team & Budget", value: teamAndBudget, onChange: setTeamAndBudget, placeholder: "e.g. 2 engineers, $50k" },
  ];

  return (
    <div className="min-h-screen bg-[#020202] text-[#EDEDED] font-sans selection:bg-purple-500/30 overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Static glows: animating large blurred layers forces full repaints and flickers */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      <nav className="fixed top-0 inset-x-0 h-16 border-b border-white/5 bg-black/50 backdrop-blur-md z-50 flex items-center justify-between px-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Zap size={18} className="text-white fill-white" />
          </div>
          <span className="font-bold text-xl tracking-tighter">
            FORGE<span className="text-purple-500">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <span className="hover:text-white cursor-pointer transition-colors">Documentation</span>
          <span className="hover:text-white cursor-pointer transition-colors">Pricing</span>
          <button className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-white text-xs">
            Connect Github
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-32 pb-24 relative z-10">
        <AnimatePresence mode="wait">
          {!projectId ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-8"
              >
                <Sparkles size={12} />
                <span>Next-Gen Startup Orchestrator v2.0</span>
              </motion.div>

              <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
                FORGE THE <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400">
                  FUTURE
                </span>
              </h1>

              <p className="max-w-2xl mx-auto text-xl text-gray-400 font-light mb-12 leading-relaxed">
                Describe your vision. Our swarm of autonomous AI agents will handle the research, code, and deployment.
                You handle the revenue.
              </p>

              <div className="max-w-3xl mx-auto">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-[2rem] blur opacity-25 group-focus-within:opacity-50 transition duration-1000" />
                  <div className="relative bg-[#0A0A0A] border border-white/10 rounded-[2rem] p-4 shadow-2xl">
                    <textarea
                      autoFocus
                      className="w-full h-40 bg-transparent border-none focus:ring-0 p-6 text-xl text-white placeholder-gray-700 resize-none"
                      placeholder="I want to build a decentralized marketplace for high-end digital fashion..."
                      value={idea}
                      onChange={(e) => setIdea(e.target.value)}
                    />

                    {/* Advanced Options Toggle */}
                    <button
                      type="button"
                      onClick={() => setShowAdvanced((v) => !v)}
                      className="mx-6 mb-3 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${showAdvanced ? "rotate-180" : ""}`}
                      />
                      Advanced Options
                    </button>

                    <AnimatePresence>
                      {showAdvanced && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden px-6 pb-4"
                        >
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            {advancedFields.map((field) => (
                              <div key={field.label}>
                                <label className="text-xs text-gray-500 mb-1 block">{field.label}</label>
                                <input
                                  type="text"
                                  value={field.value}
                                  onChange={(e) => field.onChange(e.target.value)}
                                  placeholder={field.placeholder}
                                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                                />
                              </div>
                            ))}
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Startup Goal</label>
                            <input
                              type="text"
                              value={startupGoal}
                              onChange={(e) => setStartupGoal(e.target.value)}
                              placeholder="e.g. reach $10k MRR in 6 months, raise seed round"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-center justify-between px-4 pb-2">
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-white/5 rounded-lg text-gray-500 transition-colors">
                          <Cpu size={18} />
                        </button>
                        <button className="p-2 hover:bg-white/5 rounded-lg text-gray-500 transition-colors">
                          <Globe size={18} />
                        </button>
                      </div>
                      <button
                        onClick={startBuild}
                        disabled={isBuilding || !idea.trim()}
                        className="px-8 py-3 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center gap-2 group/btn"
                      >
                        {isBuilding ? <Loader2 className="animate-spin" /> : <span>Start Forge</span>}
                        <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {/* Header Status */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-white mb-2">
                    Project: <span className="text-purple-400">#Alpha-Forge</span>
                  </h2>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Live Stream Active</span>
                    </div>
                    <span className="text-gray-500">ID: {projectId.slice(0, 8)}...</span>
                  </div>
                </div>

                {status === "completed" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex gap-4"
                  >
                    <button
                      onClick={handleExport}
                      className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all flex items-center gap-2"
                    >
                      <Download size={16} />
                      Export Blueprint
                    </button>
                    <button
                      onClick={handleDeploy}
                      disabled={isDeploying}
                      className="px-8 py-2.5 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2"
                    >
                      {isDeploying ? <Loader2 size={18} className="animate-spin" /> : <Rocket size={18} />}
                      Launch Application
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Progress Stepper */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {STEPS.map((step, idx) => {
                  const isCompleted = currentStepIndex > idx;
                  const isActive = currentStepIndex === idx;
                  return (
                    <div
                      key={step.id}
                      className={`relative p-4 rounded-2xl border transition-all duration-500 ${
                        isActive
                          ? "bg-purple-500/10 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                          : isCompleted
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-white/2 border-white/5 opacity-40"
                      }`}
                    >
                      <div
                        className={`mb-3 ${
                          isActive ? "text-purple-400" : isCompleted ? "text-emerald-400" : "text-gray-600"
                        }`}
                      >
                        <step.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                      </div>
                      <div className="text-xs font-bold uppercase tracking-wider mb-1">Step 0{idx + 1}</div>
                      <div className={`text-sm font-semibold ${isActive ? "text-white" : "text-gray-400"}`}>
                        {step.name}
                      </div>
                      {isActive && (
                        <motion.div
                          layoutId="active-glow"
                          className="absolute inset-0 rounded-2xl border border-purple-400 opacity-20"
                          animate={{ opacity: [0.1, 0.3, 0.1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Real-time Logs Terminal */}
                <div className="lg:col-span-7 bg-[#0A0A0A] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col h-[600px]">
                  <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                      <Terminal size={14} className="text-purple-500" />
                      Agent Execution Logs
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/30" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/30" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/30" />
                    </div>
                  </div>
                  <div ref={logContainerRef} className="flex-1 overflow-y-auto p-6 font-mono text-[13px] leading-relaxed space-y-2 scrollbar-hide">
                    {logs.map((log, idx) => (
                      <motion.div
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={idx}
                        className="flex gap-4 group"
                      >
                        <span className="text-gray-700 select-none w-16 shrink-0">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <div className="flex-1">
                          {log.includes("✨") ? (
                            <span className="text-emerald-400 font-bold">{log}</span>
                          ) : log.includes("❌") ? (
                            <span className="text-red-400">{log}</span>
                          ) : log.includes("Initializing") || log.includes("Connecting") ? (
                            <span className="text-blue-400 italic">{log}</span>
                          ) : (
                            <span className="text-gray-300">{log}</span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Intelligence Panel — Tabbed */}
                <div className="lg:col-span-5 space-y-4">
                  <div
                    className="bg-[#0A0A0A] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col"
                    style={{ height: 548 }}
                  >
                    {/* Tab bar */}
                    <div className="bg-white/5 border-b border-white/5 px-4 py-3 flex gap-1 overflow-x-auto scrollbar-hide shrink-0">
                      {RESULT_TABS.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            activeTab === tab.id
                              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                              : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                          }`}
                        >
                          <tab.icon size={11} />
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Tab content */}
                    <div className="flex-1 overflow-y-auto p-6">
                      {tabContent ? (
                        <motion.div
                          key={activeTab}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-gray-400 text-sm leading-relaxed font-light whitespace-pre-wrap"
                        >
                          {tabContent}
                        </motion.div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center opacity-30">
                          <Loader2 className="animate-spin mb-4" />
                          <p className="text-sm italic">
                            {isBuilding ? "Agents are working..." : "No data yet"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tech Stack Badge */}
                  <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/5 rounded-2xl p-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                      Core Stack Enforced
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {["Next.js 15", "FastAPI", "PostgreSQL", "Tailwind", "LangGraph", "OpenAI"].map((tech) => (
                        <span
                          key={tech}
                          className="px-3 py-1 bg-black/40 border border-white/10 rounded-lg text-xs font-medium text-gray-300"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-6xl mx-auto px-8 py-12 border-t border-white/5 text-gray-600 text-sm flex justify-between items-center">
        <div>© 2026 ForgeAI Labs. All rights reserved.</div>
        <div className="flex gap-8">
          <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
          <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
          <span className="hover:text-white transition-colors cursor-pointer">Twitter</span>
        </div>
      </footer>
    </div>
  );
}
