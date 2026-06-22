# Open Version

Opens a saved prototype version — switches to the right branch, restores files, and starts the dev server. Never mixes changes between projects.

## Usage
`/open-version <branch> <version-name>` — e.g. `/open-version action-triggers-prototype overview-tab-v1`

If no version name is given, just switches to the branch and opens the latest state.

## Steps

1. **Check what branch we're on and stash any uncommitted work** so nothing is lost:
```bash
CURRENT=$(git -C ~/docs-v2 branch --show-current)
git -C ~/docs-v2 stash push -m "auto-stash before switching to $ARGS"
```
If the working tree is clean, skip the stash.

2. **Switch to the requested branch**:
```bash
git -C ~/docs-v2 checkout <branch>
```
If the branch does not exist locally, check if it exists on the remote and create it:
```bash
git -C ~/docs-v2 fetch pratima-fork
git -C ~/docs-v2 checkout -b <branch> pratima-fork/<branch>
```

3. **If a version name was given**, restore files from the backup folder:
```bash
SAVE_DIR="$HOME/Desktop/Docs_Project/Custom explorers/saved-work/<branch>/<version-name>"
cp "$SAVE_DIR/actions-triggers.json" ~/docs-v2/main/config/navigation/
cp "$SAVE_DIR/nav.en.json" ~/docs-v2/main/config/
cp "$SAVE_DIR/customize.json" ~/docs-v2/main/config/navigation/
cp "$SAVE_DIR/styles.css" ~/docs-v2/main/ui/css/
cp "$SAVE_DIR/actions-triggers-reference.mdx" ~/docs-v2/main/docs/customize/actions/ 2>/dev/null
```
If no version name was given, use the current files on the branch as-is.

4. **Kill any running dev server and restart** from `~/docs-v2/main`:
```bash
pkill -f "start.js dev"
sleep 2
cd ~/docs-v2/main && mint dev
```

5. **Update memory** with which version is now active.

6. Confirm: "Opened **<branch>** / **<version>** — server starting at localhost:3000. Previous work on **$CURRENT** was stashed safely."
