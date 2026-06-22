---
name: scoped-changes
description: Enforce strict scope discipline for this project. Only modify the specific file, section, component, or value that was explicitly requested. Leave all other MDX pages, JSON schema files, the RateLimitTable component, docs.json, and navigation config untouched unless named in the request.
---

# Scoped Changes — Rate Limit Policy Docs

Make ONLY the change that was asked for. Do not improve, reformat, refactor, or clean up anything adjacent — even if it looks wrong or inconsistent.

## Before every edit

State in one sentence:
- What you will change
- What you will NOT change

If the target is ambiguous, ask before editing.

## Rules

1. **Minimum diff.** Use `Edit` with the smallest possible `old_string → new_string`. Never `Write` an existing file unless the user explicitly asked for a full rewrite.

2. **One file at a time by default.** If the request names one file, touch one file. Do not propagate changes to other tiers, pages, or components unless the user says "all tiers" or "everywhere".

3. **JSON schema files are independent.** Editing `free-public.json` does not mean updating `essentials-professional.json` or any other tier file — even if the same endpoint appears there.

4. **`RateLimitTable.jsx` and schema files are separate.** Updating a value in a JSON file does not mean updating the matching entry in `RateLimitTable.jsx` (and vice versa) unless explicitly asked. Note the discrepancy at the end of your response.

5. **Do not touch these unless named:**
   - Other tier JSON files not mentioned
   - `docs.json` navigation config
   - `rate-limit-policy.mdx` (overview page)
   - `rate-limit-use-cases.mdx`
   - `database-connections-rate-limits.mdx`
   - `RateLimitTable.jsx` data when only asked to change a schema file
   - CI validation scripts

6. **No opportunistic fixes.** If you spot a stale `lastVerified` date, a mismatched limit, a broken link, or a typo outside the requested scope — do NOT fix it. Note it in one line at the end so the user can decide.

7. **No scope creep.** Adding a new endpoint policy to one tier does not mean adding it to all tiers. Changing a `sustainedLimit` does not mean also updating `burstLimit`.

## When a change genuinely requires touching other files

Make the minimum additional edits needed for the change to function. List every out-of-scope file touched and why, in the end-of-turn summary.

## Response shape

- **Before editing:** one sentence — what changes and what stays untouched.
- **After editing:** one or two sentences — what changed, plus any out-of-scope issues noticed but deliberately skipped.

## Hard stops — never without explicit request

- Updating `docs.json` navigation
- Switching or removing subscription tier tabs
- Reformatting entire JSON files
- Changing `schemaVersion` or `lastVerified` when only a limit value was asked about
- Running formatters or linters that rewrite files
- Modifying the CI workflow file
