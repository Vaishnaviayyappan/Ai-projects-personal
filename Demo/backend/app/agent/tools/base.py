from dataclasses import dataclass, field
from typing import Any, Callable

from sqlalchemy.orm import Session


@dataclass
class ToolResult:
    success: bool
    data: dict[str, Any] = field(default_factory=dict)
    error: str | None = None


@dataclass
class ToolSpec:
    name: str
    description: str
    parameters: dict[str, str]  # param_name -> description, used for the LLM tool-selection prompt
    handler: Callable[[Session, str, str, dict[str, Any]], ToolResult]


class ToolRegistry:
    def __init__(self):
        self._tools: dict[str, ToolSpec] = {}

    def register(self, spec: ToolSpec) -> None:
        self._tools[spec.name] = spec

    def get(self, name: str) -> ToolSpec | None:
        return self._tools.get(name)

    def all(self) -> list[ToolSpec]:
        return list(self._tools.values())

    def describe_for_prompt(self, allowed_names: set[str]) -> str:
        lines = []
        for spec in self._tools.values():
            if spec.name not in allowed_names:
                continue
            params = ", ".join(f"{k} ({v})" for k, v in spec.parameters.items())
            lines.append(f"- {spec.name}: {spec.description}. Parameters: {params}")
        return "\n".join(lines) if lines else "(no tools available)"


registry = ToolRegistry()
