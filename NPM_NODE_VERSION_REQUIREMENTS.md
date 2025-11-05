# npm and Node.js Version Compatibility

**Current Environment:**
- npm: 10.9.4
- Node: 22.21.0
- Package Lock: v3 (npm 7+)

---

## ✅ Supported Versions

### **Recommended (What We Used)**
```json
{
  "node": "^22.12.0",
  "npm": "^10.0.0"
}
```

**Why:**
- This is what the modernization was built and tested with
- Fully compatible with all dependencies
- Latest LTS versions

---

### **Minimum Required (Based on Dependencies)**

The most restrictive dependency is **Vite 7.2.0**, which requires:

```json
{
  "node": "^20.19.0 || >=22.12.0",
  "npm": ">=7.0.0"
}
```

**Breakdown by critical dependencies:**

| Package | Node Requirement | Most Restrictive? |
|---------|-----------------|-------------------|
| **Vite 7.2.0** | ^20.19.0 \|\| >=22.12.0 | ✅ **YES** |
| Electron 38.5.0 | >= 12.20.55 | No |
| TypeScript 5.7.2 | >=14.17 | No |
| React 18.3.1 | >=0.10.0 | No |
| @mui/material 6.5.0 | >=14.0.0 | No |
| Redux Toolkit 2.10.1 | >=14.0.0 | No |

---

## 📊 Node.js Version Guide

### Node 22.x (Current LTS "Jod") ✅ **RECOMMENDED**
- **Node:** 22.12.0+
- **npm:** 10.9.0+
- **Status:** Active LTS (until 2027-04-30)
- **Support:** ✅ Full support for all features

### Node 20.x (Previous LTS "Iron") ✅ **SUPPORTED**
- **Node:** 20.19.0+
- **npm:** 10.8.0+
- **Status:** Maintenance LTS (until 2026-04-30)
- **Support:** ✅ Supported by Vite 7

### Node 18.x and below ❌ **NOT SUPPORTED**
- **Reason:** Vite 7 requires Node 20.19.0+
- **Action:** Upgrade to Node 20 or 22

---

## 🔄 npm Version to Node Version Mapping

| npm Version | Node Version | Status | Supported? |
|------------|--------------|--------|------------|
| npm 11.x | Node 23.x | Current | ✅ Yes (forward compatible) |
| **npm 10.x** | **Node 20.x, 22.x** | **Active LTS** | ✅ **RECOMMENDED** |
| npm 9.x | Node 18.x | Maintenance | ⚠️ No (Vite 7 incompatible) |
| npm 8.x | Node 16.x | EOL | ❌ No |
| npm 7.x | Node 15.x | EOL | ❌ No |
| npm 6.x | Node 12.x-14.x | EOL | ❌ No |

---

## 🎯 Quick Answer

**What npm versions does this stack support?**

### ✅ Fully Supported
- **npm 10.x** (with Node 20.19.0+ or Node 22.12.0+)
- **npm 11.x** (with Node 23.x - forward compatible)

### ⚠️ Minimum Requirement
- **npm 7.0.0+** (for package-lock.json v3 format)
- Must be paired with **Node 20.19.0+** or **Node 22.12.0+**

### ❌ Not Supported
- npm 6.x and below (EOL, incompatible with lockfile v3)
- Any npm with Node < 20.19.0 (Vite 7 incompatible)

---

## 🛠️ How to Check Your Versions

```bash
# Check current versions
npm --version
node --version

# Check if compatible (should see "Node 20.19.0+" or "Node 22.12.0+")
node --version
```

---

## 📦 How to Upgrade

### Option 1: Using nvm (Recommended)

```bash
# Install Node 22 LTS
nvm install 22

# Use it
nvm use 22

# Set as default
nvm alias default 22

# Verify
node --version  # Should show v22.x.x
npm --version   # Should show 10.x.x
```

### Option 2: Direct Download
- Download from: https://nodejs.org/
- Choose "LTS (Recommended for Most Users)"
- Current LTS includes Node 22.x with npm 10.x

### Option 3: Using Package Managers

**macOS (Homebrew):**
```bash
brew install node@22
```

**Windows (Chocolatey):**
```bash
choco install nodejs-lts
```

**Linux (NodeSource):**
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

## 🔒 Enforcing Version Requirements

To prevent installation with incompatible versions, add this to `package.json`:

```json
{
  "engines": {
    "node": "^20.19.0 || >=22.12.0",
    "npm": ">=10.0.0"
  }
}
```

Then enable strict engine checking:

```bash
# In .npmrc (project root)
engine-strict=true
```

This will prevent `npm install` with incompatible versions.

---

## ⚠️ Common Issues

### Issue: "npm ERR! Unsupported engine"
**Cause:** Node/npm version too old
**Solution:** Upgrade to Node 22.x or Node 20.19.0+

### Issue: "lockfileVersion 3 not recognized"
**Cause:** npm 6 or below
**Solution:** Upgrade to npm 10.x

### Issue: Vite build fails
**Cause:** Node < 20.19.0
**Solution:** Upgrade to Node 20.19.0+ or 22.12.0+

---

## 📋 CI/CD Recommendations

### GitHub Actions
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '22.x'  # or '20.19.0'
    cache: 'npm'
```

### GitLab CI
```yaml
image: node:22-alpine
```

### Docker
```dockerfile
FROM node:22-alpine
```

---

## 🎯 Summary

**Simple Answer:**
- **Node:** 22.12.0+ (or 20.19.0+)
- **npm:** 10.0.0+

**Current Setup (Used for Modernization):**
- **Node:** 22.21.0 ✅
- **npm:** 10.9.4 ✅

**Why These Versions?**
- Vite 7 requires Node 20.19.0+
- Package lock v3 requires npm 7+
- Node 22 is current LTS (supported until 2027)

Your stack is using **the latest LTS versions** and is fully supported! 🎉
