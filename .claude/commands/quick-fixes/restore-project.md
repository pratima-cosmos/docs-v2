# Restore / Recover Project

---

## Restore a saved version from backup folder

```bash
BRANCH="action-triggers-prototype"
VERSION="overview-tab-v1"   # replace with your version name
SAVE_DIR="$HOME/Desktop/Docs_Project/Custom explorers/saved-work/$BRANCH/$VERSION"

cp "$SAVE_DIR/actions-triggers.json" ~/docs-v2/main/config/navigation/
cp "$SAVE_DIR/nav.en.json" ~/docs-v2/main/config/
cp "$SAVE_DIR/customize.json" ~/docs-v2/main/config/navigation/
cp "$SAVE_DIR/styles.css" ~/docs-v2/main/ui/css/
cp "$SAVE_DIR/actions-triggers-reference.mdx" ~/docs-v2/main/docs/customize/actions/ 2>/dev/null

# Restart server to pick up restored files
pkill -f "start.js dev" && sleep 2 && cd ~/docs-v2/main && mint dev
```

---

## See all saved versions for a branch

```bash
ls "$HOME/Desktop/Docs_Project/Custom explorers/saved-work/action-triggers-prototype/"
```

---

## Recover work lost in a stash

```bash
# List all stashes
git -C ~/docs-v2 stash list

# Preview what's in a stash
git -C ~/docs-v2 stash show stash@{0} --stat

# Restore a stash
git -C ~/docs-v2 stash pop stash@{0}
```

---

## Project looks broken — revert to last commit

```bash
# See recent commits
git -C ~/docs-v2 log --oneline -5

# Discard all uncommitted changes and go back to last commit
git -C ~/docs-v2 checkout .
```

---

## See what remote branch looks like (without applying)

```bash
git -C ~/docs-v2 fetch pratima-fork
git -C ~/docs-v2 diff HEAD pratima-fork/action-triggers-prototype -- main/config/navigation/actions-triggers.json
```
