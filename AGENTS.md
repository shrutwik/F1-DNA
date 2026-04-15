# AGENTS.md

This repo optimizes for **low token use** and **clean subagent handoffs**.

1. **Sandbox first** — For large command output, file analysis, and web pages, use context-mode MCP tools so only summaries enter the model. Rules: [`.cursor/rules/context-mode.mdc`](.cursor/rules/context-mode.mdc). Upstream project: [mksglu/context-mode](https://github.com/mksglu/context-mode).
2. **Cursor** — Enable MCP from [`.cursor/mcp.json`](.cursor/mcp.json). Hooks in [`.cursor/hooks.json`](.cursor/hooks.json) invoke `npx -y context-mode` so a global install is optional; network on first run is required unless you pre-cache the package.
3. **Claude Code** — See [`CLAUDE.md`](CLAUDE.md) and [`.claude/POLICY.md`](.claude/POLICY.md).
4. **Subagents** — Full prompts: `implementer-prompt.md`, `spec-reviewer-prompt.md`, `code-quality-reviewer-prompt.md`. Orchestrator passes complete task text; subagents do not read plans from disk. Workflow skill: [obra/superpowers](https://github.com/obra/superpowers).
