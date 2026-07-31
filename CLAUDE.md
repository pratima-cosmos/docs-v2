# docs-v2

Mintlify monorepo for Auth0 documentation. Not a managed monorepo — each folder is independent.

## Layout
- `main/` — primary docs site (https://auth0.com/docs), own `docs.json`
- `auth4genai/` — Auth0 for AI Agents site (https://auth0.com/ai/docs), own `docs.json`
- `ui/` — shared React/Vite/MobX component library (built separately, output is a UMD bundle)
- `universal-components/` — shared interactive component library

## Build & dev
- Docs: `cd main && mint dev` (or `cd auth4genai && mint dev`) — disable VPN on first run
- UI: `cd ui && npm run build` — required after any UI changes before testing in docs
- Lint broken links: `mint broken-links` (from inside `main/` or `auth4genai/`)
- After merging/pulling a large number of commits, `mint dev` can crash with `FATAL ERROR: ... JavaScript heap out of memory` while it reprocesses everything. Restart with `NODE_OPTIONS="--max-old-space-size=8192" mint dev` rather than assuming it's stuck.
- Note the exact installed CLI version before relying on undocumented theme behavior: `mint --version` (can differ between Node versions/installs — check under the Node version you actually run `mint dev` with).

## Canonical conventions
- **Never** run commands from the repo root for docs — always `cd` into the target site first
- After any change to `ui/`, rebuild with `npm run build` before testing; docs sites include the built UMD file
- Page navigation is manual — new `.mdx` files must be added to `docs.json` to appear in sidebar
- Deployment is automatic on push to default branch — no manual deploy step

## Guardrails
- Do not use `{{VAR}}` placeholders — use `YOUR_SOMETHING` or `<something>` (see WRITING_GUIDE.md)
- `<Warning>` is only for Early Access features with legal agreement — use `<Callout>` for plan restrictions
- MobX stores in `ui/`: keep `SessionStore`, `ClientStore`, `TenantStore` etc. separate — do not merge state concerns
- **Scope discipline**: only make the change that was explicitly asked for. Don't refactor, reformat, or "clean up" surrounding content/code as a side effect — it makes diffs hard to review and risks unrelated regressions.
- See WRITING_GUIDE.md for component usage, placeholder conventions, and writing style
- See CONTRIBUTING.md for PR conventions and link-checking setup

## OAS spec safety (`main/docs/oas/**/*.json`, `auth4genai/docs/oas/**/*.json`)
- Before adding a new reusable component under `components/schemas` or `components/responses`, grep for the name first — these files are huge (100k+ lines) and duplicate names are easy to miss.
- **A plain JSON parser is not enough to validate these files.** `JSON.parse`/Python's `json.loads` silently accept duplicate object keys (last value wins), but Mintlify's OAS parser rejects the whole file on a duplicate key (`Invalid JSON or YAML syntax: duplicated mapping key`) — and when that happens, *every* page backed by that spec loses its reference/playground content, not just the endpoint you touched. Always run a duplicate-key-aware check after editing one of these files, e.g.:
  ```python
  import json
  def check(pairs):
      seen = {}
      for k, v in pairs: seen[k] = seen.get(k, 0) + 1
      dupes = [k for k, c in seen.items() if c > 1]
      if dupes: raise ValueError(f"duplicate keys: {dupes}")
      return dict(pairs)
  json.load(open(path), object_pairs_hook=check)
  ```
- If `mint dev`'s output includes `warning - Error parsing .../*.json: ... duplicated mapping key (LINE:COL)`, treat it as a build-breaking error for that whole spec, not a warning to ignore.

## UI/theme changes (`ui/`, anything touching Mintlify's native rendered components)
- Mintlify's native components (the API Playground, code-sample tabs, etc.) are theme internals (currently theme `aspen`, CLI version — check with `mint --version`) — their class names and DOM structure are **not part of this repo** and are not guaranteed stable across Mintlify versions.
- `curl`/non-browser fetches against a local `mint dev` server return an unhydrated SPA shell (same bytes for every route) — they cannot be used to inspect real rendered DOM. Verify theme-facing changes in an actual browser (or ask for real inspected HTML/class names) before writing selectors — don't guess class names.
- **Never programmatically move or reparent DOM nodes that Mintlify's own React components render** (e.g. `appendChild` on a live element to "reposition" it). This can conflict with React's reconciliation and silently blank out entire panels — it did exactly this during the Management API playground work (2026-07-30). Prefer CSS-only changes, or additive DOM insertion (new elements), never moving existing ones.
- Prefer documented `docs.json` configuration over undocumented DOM scripting whenever a config option exists for what you're trying to change.

## Session memory
- After any meaningful change (a fix, a new page, a UI tweak), save what changed and why: run `/save-session` to log it to `~/.claude/context.md`, and update the relevant project memory file under `~/.claude/projects/*/memory/` if it reflects an ongoing project (not just a one-off edit). Don't rely on conversation history alone to carry context into the next session.
