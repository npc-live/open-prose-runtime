#!/bin/bash

# OpenProse Pre-Publish Checklist
# 运行此脚本来验证所有发布前的要求

set -e

echo "🔍 OpenProse Pre-Publish Checklist"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0
WARN=0

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARN++))
}

echo "1️⃣  Checking Required Files..."
echo "----------------------------"

# Check for required files
if [ -f "README.md" ]; then
    check_pass "README.md exists"
else
    check_fail "README.md is missing"
fi

if [ -f "LICENSE" ]; then
    check_pass "LICENSE exists"
else
    check_fail "LICENSE is missing"
fi

if [ -f "CHANGELOG.md" ]; then
    check_pass "CHANGELOG.md exists"
else
    check_fail "CHANGELOG.md is missing"
fi

if [ -f "plugin/package.json" ]; then
    check_pass "plugin/package.json exists"
else
    check_fail "plugin/package.json is missing"
fi

if [ -f "plugin/.npmignore" ]; then
    check_pass "plugin/.npmignore exists"
else
    check_warn "plugin/.npmignore is missing (will use .gitignore)"
fi

echo ""
echo "2️⃣  Checking package.json..."
echo "----------------------------"

cd plugin

# Check package.json fields
if grep -q '"name"' package.json; then
    NAME=$(node -p "require('./package.json').name")
    check_pass "Package name: $NAME"
else
    check_fail "Package name is missing"
fi

if grep -q '"version"' package.json; then
    VERSION=$(node -p "require('./package.json').version")
    check_pass "Version: $VERSION"
else
    check_fail "Version is missing"
fi

if grep -q '"description"' package.json; then
    check_pass "Description is present"
else
    check_warn "Description is missing"
fi

if grep -q '"keywords"' package.json; then
    check_pass "Keywords are present"
else
    check_warn "Keywords are missing (helps with NPM discoverability)"
fi

if grep -q '"repository"' package.json; then
    check_pass "Repository URL is present"
else
    check_warn "Repository URL is missing"
fi

if grep -q '"license"' package.json; then
    check_pass "License is specified"
else
    check_fail "License is missing"
fi

if grep -q '"author"' package.json; then
    check_pass "Author is specified"
else
    check_warn "Author is missing"
fi

echo ""
echo "3️⃣  Checking Dependencies..."
echo "----------------------------"

if [ -d "node_modules" ]; then
    check_pass "node_modules exists"
else
    check_fail "node_modules missing - run 'bun install' or 'npm install'"
fi

echo ""
echo "4️⃣  Running Tests..."
echo "----------------------------"

if command -v bun &> /dev/null; then
    if bun test 2>&1 | grep -q "PASS\|pass"; then
        check_pass "Tests passed"
    else
        check_fail "Tests failed"
    fi
else
    check_warn "Bun not installed, skipping tests"
fi

echo ""
echo "5️⃣  Checking TypeScript Build..."
echo "----------------------------"

if [ -f "tsconfig.json" ]; then
    if command -v tsc &> /dev/null; then
        if tsc --noEmit 2>&1; then
            check_pass "TypeScript compilation successful"
        else
            check_fail "TypeScript compilation failed"
        fi
    else
        check_warn "TypeScript not installed"
    fi
else
    check_warn "tsconfig.json not found"
fi

echo ""
echo "6️⃣  Checking Build Output..."
echo "----------------------------"

if bun run build 2>&1 | grep -q "error"; then
    check_fail "Build failed"
else
    check_pass "Build successful"

    if [ -d "dist" ]; then
        check_pass "dist/ directory exists"

        if [ -f "dist/index.js" ]; then
            check_pass "dist/index.js exists"
        else
            check_warn "dist/index.js not found"
        fi

        if [ -f "dist/bin/open-prose.js" ]; then
            check_pass "dist/bin/open-prose.js exists"
        else
            check_warn "dist/bin/open-prose.js not found"
        fi
    else
        check_fail "dist/ directory not found"
    fi
fi

echo ""
echo "7️⃣  Checking Git Status..."
echo "----------------------------"

cd ..

if [ -d ".git" ]; then
    check_pass ".git directory exists"

    # Check if there are uncommitted changes
    if [ -z "$(git status --porcelain)" ]; then
        check_pass "No uncommitted changes"
    else
        check_warn "There are uncommitted changes"
        git status --short
    fi

    # Check if current branch is main/master
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
        check_pass "On main/master branch"
    else
        check_warn "Not on main/master branch (current: $BRANCH)"
    fi
else
    check_warn "Not a git repository"
fi

echo ""
echo "8️⃣  Security Checks..."
echo "----------------------------"

# Check for hardcoded secrets
if grep -r "sk-" plugin/src/ 2>/dev/null | grep -v "example\|test\|spec" | grep -v "node_modules"; then
    check_fail "Potential hardcoded API keys found"
else
    check_pass "No hardcoded API keys detected"
fi

# Check for TODO/FIXME in source
TODO_COUNT=$(grep -r "TODO\|FIXME" plugin/src/ 2>/dev/null | grep -v "node_modules" | wc -l | tr -d ' ')
if [ "$TODO_COUNT" -gt 0 ]; then
    check_warn "$TODO_COUNT TODO/FIXME items found in source code"
else
    check_pass "No TODO/FIXME items in source code"
fi

echo ""
echo "9️⃣  Documentation Checks..."
echo "----------------------------"

# Check if docs directory exists
if [ -d "docs" ]; then
    DOC_COUNT=$(find docs -name "*.md" | wc -l | tr -d ' ')
    check_pass "$DOC_COUNT documentation files found"
else
    check_warn "docs/ directory not found"
fi

# Check if examples exist
if [ -d "plugin/examples" ]; then
    EXAMPLE_COUNT=$(find plugin/examples -name "*.prose" | wc -l | tr -d ' ')
    check_pass "$EXAMPLE_COUNT example files found"
else
    check_warn "plugin/examples/ directory not found"
fi

echo ""
echo "🔟 Package Size Check..."
echo "----------------------------"

cd plugin

# Create a test pack
if npm pack --dry-run 2>&1 | grep -q "package size"; then
    SIZE=$(npm pack --dry-run 2>&1 | grep "package size" | awk '{print $3, $4}')
    check_pass "Estimated package size: $SIZE"

    # Warn if package is too large
    SIZE_KB=$(npm pack --dry-run 2>&1 | grep "package size" | awk '{print $3}' | tr -d 'kB' | tr -d 'B')
    if [ "$SIZE_KB" -gt 5000 ]; then
        check_warn "Package is larger than 5MB"
    fi
else
    check_warn "Could not determine package size"
fi

cd ..

echo ""
echo "=================================="
echo "📊 Summary"
echo "=================================="
echo -e "${GREEN}Passed:${NC} $PASS"
echo -e "${YELLOW}Warnings:${NC} $WARN"
echo -e "${RED}Failed:${NC} $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo ""
    echo "Ready to publish! Run:"
    echo "  cd plugin"
    echo "  npm publish --dry-run  # Test first"
    echo "  npm publish            # Publish for real"
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please fix them before publishing.${NC}"
    exit 1
fi
