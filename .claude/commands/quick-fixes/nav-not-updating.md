# Nav / Sidebar Not Updating

Mint sometimes doesn't hot-reload JSON config changes. Always restart the server after editing nav files.

---

## Changes to nav.en.json or any navigation/*.json not showing

```bash
# Restart the dev server
pkill -f "start.js dev" && sleep 2 && cd ~/docs-v2/main && mint dev
```

Then do a hard reload in browser: **Cmd + Shift + R**

---

## Page content changed but browser still shows old version

Hard reload the browser: **Cmd + Shift + R**

Or clear browser cache for localhost:
- Chrome: DevTools → Application → Storage → Clear site data

---

## Nav item shows but clicking it doesn't navigate

This usually means the page is registered in two different nav sections (conflict). Fix:

1. Find which nav files reference the page:
```bash
grep -r "the-page-slug" ~/docs-v2/main/config/navigation/
```

2. Remove the page from the nav section where it doesn't belong.

3. Restart the server.

---

## New MDX page added but not appearing in sidebar

Make sure the page path is in the correct navigation JSON file and restart:
```bash
pkill -f "start.js dev" && sleep 2 && cd ~/docs-v2/main && mint dev
```

---

## Check for nav errors in server logs

```bash
cat /tmp/mint-ready.log | strings | grep -i "error\|warn\|invalid" | head -20
```
