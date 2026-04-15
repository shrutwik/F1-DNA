# F1-DNA

**Token floor:** heavy outputs and analysis go through context-mode MCP (`ctx_batch_execute`, `ctx_execute`, `ctx_execute_file`, `ctx_fetch_and_index`, `ctx_search`). Cursor loads [`../.cursor/rules/context-mode.mdc`](../.cursor/rules/context-mode.mdc) automatically.

**Deep policy (optional read):** [`POLICY.md`](POLICY.md) — Superpowers workflow, response shape, Claude-only hooks.

**Subagents:** [`implementer-prompt.md`](implementer-prompt.md), [`spec-reviewer-prompt.md`](spec-reviewer-prompt.md), [`code-quality-reviewer-prompt.md`](code-quality-reviewer-prompt.md). Orchestrator pastes full task text; subagent does not load plan files.

**References:** [mksglu/context-mode](https://github.com/mksglu/context-mode) (sandbox MCP), [obra/superpowers](https://github.com/obra/superpowers) (skills workflow).

**Diagnostics:** `/context-mode:ctx-stats`, `/context-mode:ctx-doctor` (Claude Code plugin) or `ctx stats` / `ctx doctor` where supported.
