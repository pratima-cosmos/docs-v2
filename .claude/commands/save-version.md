# Save Version

Saves the current prototype state to a named backup and updates memory. Run this any time you want a checkpoint you can return to.

## Usage
`/save-version <name>` — e.g. `/save-version overview-tab-v1`

## Steps

1. **Check current branch**
```bash
git -C ~/docs-v2 branch --show-current
```

2. **Commit all current changes** on the current branch so nothing is lost:
```bash
git -C ~/docs-v2 add -A
git -C ~/docs-v2 commit -m "chore: save checkpoint - $ARGS"
```
If there is nothing to commit, skip this step.

3. **Create a backup folder** named after the branch + version label:
```bash
BRANCH=$(git -C ~/docs-v2 branch --show-current)
SAVE_DIR="$HOME/Desktop/Docs_Project/Custom explorers/saved-work/${BRANCH}/${ARGS}"
mkdir -p "$SAVE_DIR"
```

4. **Copy the key prototype files** into that folder:
```bash
cp ~/docs-v2/main/config/navigation/actions-triggers.json "$SAVE_DIR/"
cp ~/docs-v2/main/config/nav.en.json "$SAVE_DIR/"
cp ~/docs-v2/main/config/navigation/customize.json "$SAVE_DIR/"
cp ~/docs-v2/main/ui/css/styles.css "$SAVE_DIR/"
# Also copy any new MDX files added for this prototype
cp ~/docs-v2/main/docs/customize/actions/actions-triggers-reference.mdx "$SAVE_DIR/" 2>/dev/null
```

5. **Write a notes.md** in the save folder summarising what this version contains and what changed.

6. **Update memory** at `~/.claude/projects/-Users-pratima-rajput/memory/project_action_triggers_prototype.md` with:
   - The version name and what it contains
   - The git branch it was saved on
   - The save folder path

7. Confirm to the user: "Saved version **$ARGS** on branch **$BRANCH** to `saved-work/$BRANCH/$ARGS/`"
