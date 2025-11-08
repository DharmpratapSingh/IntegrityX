# 🚀 CI/CD Commands Cheat Sheet

Quick reference for using your new CI/CD pipeline!

---

## 📦 **COMMIT & PUSH (First Time)**

```bash
# Navigate to project
cd /Users/dharmpratapsingh/ChallengeX/WalacorFinancialIntegrity/IntegrityX_Python

# Add CI/CD files
git add .github/ CICD*.md QUICK_START_CICD.md
git add README.md verify_integrityx.sh .gitignore

# Commit
git commit -m "feat: Add production-ready CI/CD pipeline

- Add CI pipeline with automated testing
- Add deployment pipeline for staging/production
- Add PR validation workflow
- Add comprehensive documentation
- Update README with CI/CD section
- Update verification script

Score: 92/100 → 95/100 ⭐⭐⭐⭐⭐"

# Push
git push origin main
```

**Result**: GitHub Actions automatically starts testing! 🚀

---

## 🔍 **VERIFY LOCALLY**

```bash
./verify_integrityx.sh
```

**Expected**: ✅ Score: 100/100

---

## 🌿 **NORMAL DEVELOPMENT WORKFLOW**

### **1. Create Feature Branch**
```bash
git checkout -b feature/my-awesome-feature
```

### **2. Make Changes**
```bash
# ... code, code, code ...
```

### **3. Commit & Push**
```bash
git add .
git commit -m "feat: Add awesome new feature"
git push origin feature/my-awesome-feature
```

**Result**: CI automatically tests your code! (~5 min)

### **4. Create Pull Request**
```bash
# Go to GitHub → Pull Requests → New PR
# Or use GitHub CLI:
gh pr create --title "Add awesome feature" --body "Description here"
```

**Result**: Automatic checks run and show in PR!

### **5. Merge to Main**
```bash
# After approval, merge on GitHub
# Or via CLI:
gh pr merge
```

---

## 🚀 **DEPLOYMENT**

### **Deploy to Staging**
```bash
git checkout develop
git merge feature/my-awesome-feature
git push origin develop
```

**Result**: Automatically deploys to staging! (~15 min)

### **Deploy to Production**
```bash
# Create version tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

**Result**: Automatically deploys to production! (~20 min)

---

## 📊 **VIEW CI/CD STATUS**

### **Via GitHub Web**
```bash
# Open in browser
open https://github.com/YOUR_USERNAME/IntegrityX_Python/actions
```

### **Via GitHub CLI**
```bash
# List workflow runs
gh run list

# View specific run
gh run view RUN_ID

# Watch run in real-time
gh run watch
```

---

## 🐛 **TROUBLESHOOTING**

### **View Failed Workflow**
```bash
# List recent runs
gh run list --limit 10

# View logs of failed run
gh run view RUN_ID --log-failed
```

### **Re-run Failed Workflow**
```bash
gh run rerun RUN_ID
```

### **Cancel Running Workflow**
```bash
gh run cancel RUN_ID
```

---

## 🔐 **GITHUB SECRETS**

### **Add Secret via CLI**
```bash
gh secret set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# Paste value when prompted
```

### **List Secrets**
```bash
gh secret list
```

### **Delete Secret**
```bash
gh secret delete SECRET_NAME
```

---

## 📝 **COMMON COMMIT MESSAGES**

```bash
# New feature
git commit -m "feat: Add user authentication"

# Bug fix
git commit -m "fix: Resolve login redirect issue"

# Documentation
git commit -m "docs: Update API documentation"

# Performance improvement
git commit -m "perf: Optimize database queries"

# Refactoring
git commit -m "refactor: Restructure authentication module"

# Testing
git commit -m "test: Add integration tests for API"

# CI/CD changes
git commit -m "ci: Update GitHub Actions workflow"

# Build/dependency changes
git commit -m "build: Update dependencies"
```

---

## 🎯 **QUICK CHECKS**

### **Check CI/CD Status**
```bash
gh run list --limit 1
```

### **Check Last Commit Status**
```bash
git log -1 --oneline
gh run list --commit $(git rev-parse HEAD)
```

### **Check Current Branch**
```bash
git branch --show-current
```

### **Check What Would Be Pushed**
```bash
git diff origin/main..HEAD --stat
```

---

## 📚 **DOCUMENTATION COMMANDS**

### **View Workflow File**
```bash
cat .github/workflows/ci.yml
```

### **View All Workflows**
```bash
ls -la .github/workflows/
```

### **View CI/CD Guide**
```bash
cat QUICK_START_CICD.md
# or
open CICD_SETUP_GUIDE.md
```

---

## 🔄 **UPDATE WORKFLOWS**

### **Edit CI Workflow**
```bash
nano .github/workflows/ci.yml
# Make changes
git add .github/workflows/ci.yml
git commit -m "ci: Update CI workflow"
git push origin main
```

### **Test Workflow Locally** (with act)
```bash
# Install act first: brew install act
act -l  # List workflows
act push  # Test push event
```

---

## 📈 **MONITOR DEPLOYMENTS**

### **Check Latest Deployment**
```bash
gh run list --workflow=deploy.yml --limit 1
```

### **View Deployment Logs**
```bash
gh run view --log --job="Deploy to Production"
```

---

## 🎊 **QUICK WINS**

### **See All CI/CD Stats**
```bash
echo "=== CI/CD Statistics ==="
echo "Workflows: $(find .github/workflows -name "*.yml" | wc -l)"
echo "Recent runs: $(gh run list --limit 10 | wc -l)"
echo "Success rate: $(gh run list --limit 20 --json conclusion --jq '[.[] | select(.conclusion=="success")] | length')/20"
```

### **Verify Everything**
```bash
./verify_integrityx.sh && echo "✅ All good!" || echo "❌ Issues found"
```

### **Quick Status**
```bash
echo "Branch: $(git branch --show-current)"
echo "Last commit: $(git log -1 --oneline)"
echo "CI Status: $(gh run list --limit 1 --json conclusion --jq '.[0].conclusion')"
```

---

## 🚀 **ONE-LINERS FOR COMMON TASKS**

### **Quick Feature**
```bash
git checkout -b feature/quick-fix && echo "# Fix" >> CHANGELOG.md && git add . && git commit -m "fix: Quick fix" && git push origin feature/quick-fix
```

### **Check & Push**
```bash
./verify_integrityx.sh && git push origin main || echo "❌ Verification failed"
```

### **Tag & Release**
```bash
read -p "Version (e.g., 1.0.0): " ver && git tag -a "v$ver" -m "Release v$ver" && git push origin "v$ver"
```

---

## 📞 **GET HELP**

```bash
# GitHub Actions help
gh help

# View specific command help
gh run --help

# Open documentation
open CICD_SETUP_GUIDE.md
```

---

## ⚡ **POWER TIPS**

1. **Alias for common commands**:
```bash
# Add to ~/.zshrc or ~/.bashrc
alias ci-status='gh run list --limit 5'
alias ci-watch='gh run watch'
alias ci-test='./verify_integrityx.sh'
```

2. **Auto-push after successful verification**:
```bash
./verify_integrityx.sh && git push origin main || echo "❌ Fix issues first"
```

3. **Quick PR creation**:
```bash
git push origin HEAD && gh pr create --fill
```

---

**Remember**: 
- Every push triggers CI
- PR creation triggers validation
- Tags trigger deployment
- ~5 minutes for tests, ~20 minutes for full deployment

**Questions?** Check [CICD_SETUP_GUIDE.md](./CICD_SETUP_GUIDE.md)

---

**Status**: ✅ Ready to use!  
**Next**: Push to GitHub and watch it work! 🚀

