# Cache Reset

---

## Quick cache clear and restart

```bash
pkill -f "start.js dev"
rm -rf ~/.mintlify
cd ~/docs-v2/main && mint dev
```

---

## Mint bundle is corrupted or outdated — full nuke and reinstall

```bash
# Kill server
pkill -f "start.js dev"

# Delete cache
rm -rf ~/.mintlify

# Get current version number
VERSION=$(curl -s https://releases.mintlify.com/mint-version.txt)
echo "Latest version: $VERSION"

# Download fresh bundle
mkdir -p ~/.mintlify
curl -L --retry 5 --retry-delay 3 --continue-at - \
  "https://releases.mintlify.com/mint-${VERSION}.tar.gz" \
  -o ~/.mintlify/mint.tar.gz

# Extract and write version file
cd ~/.mintlify && tar -xzf mint.tar.gz && echo "$VERSION" > mint/mint-version.txt && rm mint.tar.gz

# Restart
cd ~/docs-v2/main && mint dev
```

---

## Clear Next.js build cache (if server starts but pages fail to render)

```bash
rm -rf ~/.mintlify/mint/apps/client/.next
pkill -f "start.js dev" && sleep 2 && cd ~/docs-v2/main && mint dev
```

---

## Check what version is cached

```bash
cat ~/.mintlify/mint/mint-version.txt
```

## Check what version is latest

```bash
curl -s https://releases.mintlify.com/mint-version.txt
```
