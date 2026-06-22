# Branch Switching

---

## Switch to a prototype branch safely

```bash
# Step 1: Stash current work so nothing is lost
git -C ~/docs-v2 stash push -m "WIP before switching"

# Step 2: Switch branch
git -C ~/docs-v2 checkout action-triggers-prototype

# Step 3: Restart server
pkill -f "start.js dev" && sleep 2 && cd ~/docs-v2/main && mint dev
```

---

## Switch to main

```bash
git -C ~/docs-v2 stash push -m "WIP before going to main"
git -C ~/docs-v2 checkout main
pkill -f "start.js dev" && sleep 2 && cd ~/docs-v2/main && mint dev
```

---

## Restore stashed work after switching back

```bash
# See all stashes
git -C ~/docs-v2 stash list

# Restore the most recent stash
git -C ~/docs-v2 stash pop

# Restore a specific stash (replace 1 with the stash number from the list)
git -C ~/docs-v2 stash pop stash@{1}
```

---

## See what changes are in a stash before restoring

```bash
git -C ~/docs-v2 stash show stash@{0} --stat
```

---

## Branch got messy — reset to last clean commit

```bash
# See recent commits
git -C ~/docs-v2 log --oneline -5

# Discard all uncommitted changes (WARNING: this deletes unsaved work)
git -C ~/docs-v2 checkout .
```

---

## See all branches

```bash
# Local branches
git -C ~/docs-v2 branch

# All including remote
git -C ~/docs-v2 branch -a
```
