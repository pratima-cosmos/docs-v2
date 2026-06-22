# Quick Fix Commands

Fast copy-paste commands for common issues. Find the problem, grab the command, run it.

---

## Categories

| File | Covers |
|---|---|
| [mint-server.md](mint-server.md) | Dev server stuck, slow prep, won't start, port conflicts |
| [branch-switch.md](branch-switch.md) | Switching branches safely, stash/restore, lost changes |
| [cache-reset.md](cache-reset.md) | Clear mint cache, force fresh download, nuke and restart |
| [nav-not-updating.md](nav-not-updating.md) | Sidebar changes not showing, JSON config not picked up |
| [restore-project.md](restore-project.md) | Restore a saved version, recover lost work from stash |

---

## Fastest Fixes (try these first)

```bash
# Server not reflecting changes → restart it
pkill -f "start.js dev" && sleep 2 && cd ~/docs-v2/main && mint dev

# Port already in use
pkill -f "start.js dev"

# Page still showing old content → hard reload in browser
# Mac: Cmd + Shift + R

# Check what branch you're on
git -C ~/docs-v2 branch --show-current

# See all stashed work
git -C ~/docs-v2 stash list
```
