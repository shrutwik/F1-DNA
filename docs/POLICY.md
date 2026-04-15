# F1-DNA — full policy (load only when needed)

## Context-mode (mandatory for bulky work)

- `ctx_batch_execute` — multi-command research + index + search in one call.
- `ctx_execute` — parse JSON/logs/stats in sandbox; return short summary only.
- `ctx_execute_file` — analyze large files without loading bytes into the model.
- `ctx_fetch_and_index` + `ctx_search` — web/docs without raw HTML in chat.

Avoid: Bash when output exceeds ~20 lines; Read for analysis-only passes; raw WebFetch for pages you will summarize.

## Response shape

- Under ~500 words unless the user asks otherwise.
- Put artifacts in the repo; chat cites paths + one-line outcome.

## Superpowers workflow (when building product code)

1. Brainstorm → 2. Plan → 3. Git worktree → 4. Subagent-driven tasks → 5. TDD → 6. Review → 7. Finish branch.

Use installed skills: brainstorming, writing-plans, using-git-worktrees, subagent-driven-development, test-driven-development, finishing-a-development-branch.

## Claude Code hooks

Project [`.claude/hooks.json`](../.claude/hooks.json) adds size/output nudges. Cursor uses [`.cursor/hooks.json`](../.cursor/hooks.json) with `npx -y context-mode` for PreToolUse routing (see also [`.cursor/mcp.json`](../.cursor/mcp.json)).
