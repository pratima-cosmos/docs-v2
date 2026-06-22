# Mint Server Issues

---

## Stuck on "preparing local preview..." for more than 2 minutes

The mint bundle download got interrupted or the CDN connection dropped.

```bash
# Step 1: Kill the stuck process
pkill -f "start.js dev"

# Step 2: Check what's in the cache
ls ~/.mintlify/

# Step 3a: If mint.tar.gz exists but no mint/ folder → extract it manually
cd ~/.mintlify && tar -xzf mint.tar.gz && echo "0.0.3074" > mint/mint-version.txt && rm mint.tar.gz

# Step 3b: If no tar.gz or extraction fails → clear and re-download
rm -rf ~/.mintlify
curl -L --retry 5 --retry-delay 3 --continue-at - \
  "https://releases.mintlify.com/mint-0.0.3074.tar.gz" \
  -o ~/.mintlify/mint.tar.gz
cd ~/.mintlify && tar -xzf mint.tar.gz && echo "0.0.3074" > mint/mint-version.txt && rm mint.tar.gz

# Step 4: Start fresh
cd ~/docs-v2/main && mint dev
```

---

## Server not starting at all

```bash
# Check if port 3000 is already taken
lsof -i :3000 | grep LISTEN

# Kill whatever is on port 3000
kill -9 $(lsof -t -i:3000)

# Check if mint processes are still running
ps aux | grep "mint\|start.js" | grep -v grep

# Kill all mint processes
pkill -f "start.js dev"

# Start fresh
cd ~/docs-v2/main && mint dev
```

---

## Two mint servers running (port conflict)

```bash
# See all mint processes
ps aux | grep "mint" | grep -v grep

# Kill all of them
pkill -f "start.js dev"
pkill -f "bin/mint"

# Start one clean instance
cd ~/docs-v2/main && mint dev
```

---

## Check current mint version

```bash
mint --version
```

## Update mint to latest

```bash
npm install -g mint
```
