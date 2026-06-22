# New Prototype

Creates a new isolated branch for a fresh prototype. Ensures changes never bleed into other projects. Always starts from the latest main.

## Usage
`/new-prototype <branch-name> <description>` — e.g. `/new-prototype search-redesign "New search UI exploration"`

## Steps

1. **Stash any uncommitted work** on the current branch:
```bash
CURRENT=$(git -C ~/docs-v2 branch --show-current)
git -C ~/docs-v2 stash push -m "auto-stash before creating $ARGS"
```

2. **Fetch latest main** so the new branch starts clean:
```bash
git -C ~/docs-v2 fetch origin
git -C ~/docs-v2 checkout main
git -C ~/docs-v2 pull origin main
```

3. **Create the new branch**:
```bash
git -C ~/docs-v2 checkout -b <branch-name>
```

4. **Create a save folder** for this project:
```bash
mkdir -p "$HOME/Desktop/Docs_Project/Custom explorers/saved-work/<branch-name>"
```

5. **Create a notes.md** in that folder with:
   - Branch name
   - Description / goal of the prototype
   - Date created
   - Files this prototype will touch

6. **Save a memory entry** for this new project at `~/.claude/projects/-Users-pratima-rajput/memory/` so it is remembered across sessions.

7. **Restart the dev server** from `~/docs-v2/main`:
```bash
pkill -f "start.js dev"
sleep 2
cd ~/docs-v2/main && mint dev
```

8. Confirm: "New prototype branch **<branch-name>** created from latest main. Previous work on **$CURRENT** was stashed. Save folder ready at `saved-work/<branch-name>/`. Use `/save-version` to checkpoint your work and `/open-version` to return to it."
