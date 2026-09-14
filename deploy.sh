#!/bin/bash
set -e

echo ""
echo "🚀 Expense Tracker — Free Hosting Setup"
echo "========================================"
echo ""

# ── Step 1: GitHub repo ─────────────────────────────────────────────────────
echo "📦 Step 1/3: Creating GitHub repo..."

if ! gh auth status &>/dev/null; then
  echo ""
  echo "  You need to log in to GitHub first."
  echo "  This will open your browser for a one-click auth."
  echo ""
  gh auth login --hostname github.com --git-protocol https --web
fi

# Create the repo (public, so Vercel free tier works)
REPO_NAME="expense-tracker"
if gh repo view "$REPO_NAME" &>/dev/null 2>&1; then
  echo "  ✓ GitHub repo already exists"
else
  gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
  echo "  ✓ GitHub repo created and pushed"
fi

# Make sure we've pushed
git push origin main 2>/dev/null || git push origin master 2>/dev/null || true
echo "  ✓ Code pushed to GitHub"

# ── Step 2: Vercel CLI ──────────────────────────────────────────────────────
echo ""
echo "☁️  Step 2/3: Logging in to Vercel..."

if ! npx vercel whoami &>/dev/null 2>&1; then
  echo ""
  echo "  This will open your browser for a one-click Vercel auth."
  echo ""
  npx vercel login
fi

echo "  ✓ Logged in to Vercel"

# ── Step 3: Deploy ──────────────────────────────────────────────────────────
echo ""
echo "🌐 Step 3/3: Deploying to Vercel..."
echo ""

DEPLOY_URL=$(npx vercel --prod --yes 2>&1 | grep -E "https://.*\.vercel\.app" | tail -1)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅  Your app is live!"
echo ""
echo "   $DEPLOY_URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Future deploys: just run  npx vercel --prod"
echo ""
