#!/bin/bash
# TravelHub Version Manager with Changelog
# Usage:
#   ./scripts/version.sh [major|minor|patch|tag|list|changelog|rollback]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

CHANGELOG_FILE="CHANGELOG.md"

# Get current version from package.json
get_version() {
  node -p "require('./package.json').version"
}

# Update version in package.json
update_version() {
  local new_version=$1
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.version = '$new_version';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  "
  echo -e "${GREEN}✅ Version updated to $new_version${NC}"
}



# Update CHANGELOG.md - prepend new version entry
update_changelog() {
  local new_version=$1
  local tag="v$new_version"
  local date=$(date +%Y-%m-%d)
  
  echo -e "${CYAN}📝 Updating $CHANGELOG_FILE...${NC}"
  
  # Find previous tag
  local previous_tag=$(git tag -l "v*" | sort -V | tail -2 | head -1)
  
  # Build new entry
  local entry=""
  entry+="## [$tag] - $date\n\n"
  
  if [ -n "$previous_tag" ]; then
    # Get commits since previous tag
    local commits=$(git log "$previous_tag..HEAD" --pretty=format:"- %s (%h)" --no-merges 2>/dev/null || echo "")
    local stats=$(git diff --stat "$previous_tag..HEAD" 2>/dev/null | tail -1 || echo "")
  else
    # First version - all commits
    local commits=$(git log --pretty=format:"- %s (%h)" --no-merges 2>/dev/null || echo "")
    local stats=$(git diff --stat HEAD 2>/dev/null | tail -1 || echo "")
  fi
  
  if [ -n "$commits" ]; then
    entry+="### 📌 Changes\n\n"
    entry+="$commits\n\n"
  fi
  
  if [ -n "$stats" ]; then
    entry+="### 📊 Statistics\n\n"
    entry+="$stats\n\n"
  fi
  
  entry+="---\n\n"
  
  # If CHANGELOG.md exists, prepend; otherwise create with header
  if [ -f "$CHANGELOG_FILE" ]; then
    # Remove old header, prepend new entry
    local header="# 📋 TravelHub Changelog\n\nAll notable changes to this project will be documented in this file.\n\n---\n\n"
    local body=$(tail -n +6 "$CHANGELOG_FILE")
    echo -e "$header$entry$body" > "$CHANGELOG_FILE"
  else
    echo -e "# 📋 TravelHub Changelog\n\nAll notable changes to this project will be documented in this file.\n\n---\n\n$entry" > "$CHANGELOG_FILE"
  fi
  
  echo -e "${GREEN}✅ $CHANGELOG_FILE updated${NC}"
}

# Bump version
bump() {
  local type=$1
  local current=$(get_version)
  local major=$(echo $current | cut -d. -f1)
  local minor=$(echo $current | cut -d. -f2)
  local patch=$(echo $current | cut -d. -f3)

  case $type in
    major)
      major=$((major + 1))
      minor=0
      patch=0
      ;;
    minor)
      minor=$((minor + 1))
      patch=0
      ;;
    patch)
      patch=$((patch + 1))
      ;;
    *)
      echo -e "${RED}❌ Unknown bump type: $type${NC}"
      echo "Usage: $0 [major|minor|patch]"
      exit 1
      ;;
  esac

  local new_version="$major.$minor.$patch"
  update_version $new_version
  echo -e "${BLUE}📦 Bumped from $current to $new_version ($type)${NC}"
}

# Create git tag
create_tag() {
  local version=$(get_version)
  local tag="v$version"
  
  echo -e "${YELLOW}🏷  Creating tag $tag...${NC}"
  
  # Stage all changes
  git add -A
  
  # Check if there are changes to commit
  if git diff --cached --quiet; then
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
  else
    # Update changelog before commit
    update_changelog $version
    
    git commit -m "Release v$version

Changes:
- Version $version release
- Updated CHANGELOG.md

See CHANGELOG.md for details"
    echo -e "${GREEN}✅ Changes committed${NC}"
  fi
  
  # Create annotated tag
  git tag -a $tag -m "Release version $version"
  echo -e "${GREEN}✅ Tag $tag created${NC}"
  
  echo ""
  echo -e "${BLUE}📋 Version $version saved!${NC}"
  echo -e "   📝 Changelog: ${GREEN}$CHANGELOG_FILE${NC}"
  echo -e "   🏷  Tag: ${GREEN}$tag${NC}"
  echo -e "   To push: ${YELLOW}git push origin master --tags${NC}"
  echo -e "   To rollback: ${YELLOW}./scripts/version.sh rollback${NC}"
}

# List all versions with changelogs
list_versions() {
  echo -e "${BLUE}📦 Project Versions:${NC}"
  echo ""
  
  # Current version
  local current=$(get_version)
  echo -e "  ${GREEN}Current:${NC} v$current"
  echo ""
  
  # Git tags
  echo -e "${BLUE}🏷  Tags:${NC}"
  if git tag -l "v*" | sort -V | tail -20 | grep -q .; then
    git tag -l "v*" | sort -V | while read tag; do
      local date=$(git log -1 --format="%ai" $tag 2>/dev/null | cut -d' ' -f1)
      local msg=$(git tag -l --format='%(contents:subject)' $tag 2>/dev/null | head -1)
      echo -e "  ${GREEN}$tag${NC} ($date) - $msg"
    done
  else
    echo -e "  ${YELLOW}No tags yet${NC}"
  fi
  echo ""
  
  # Recent commits
  echo -e "${BLUE}📝 Recent Commits:${NC}"
  git log --oneline -10 2>/dev/null || echo "  No commits"
}

# Show changelog for specific version
show_changelog() {
  local version=$1
  local tag="v$version"
  
  if [ -z "$version" ]; then
    echo -e "${YELLOW}Showing CHANGELOG.md:${NC}"
    echo ""
    if [ -f "$CHANGELOG_FILE" ]; then
      cat "$CHANGELOG_FILE"
    else
      echo -e "${YELLOW}No changelog found. Create first version with: $0 patch${NC}"
    fi
    return
  fi
  
  echo -e "${CYAN}📝 Changelog for $tag:${NC}"
  echo ""
  
  # Get commits for this version
  local previous_tag=$(git tag -l "v*" | sort -V | grep -B1 "^${tag}$" | head -1)
  
  if [ -n "$previous_tag" ] && [ "$previous_tag" != "$tag" ]; then
    echo -e "${BLUE}Changes since $previous_tag:${NC}"
    git log "$previous_tag..$tag" --pretty=format:"- %s (%h)" --no-merges
  else
    echo -e "${BLUE}All changes in $tag:${NC}"
    git log $tag --pretty=format:"- %s (%h)" --no-merges
  fi
  echo ""
  
  # Show diff stats
  echo -e "${BLUE}Statistics:${NC}"
  if [ -n "$previous_tag" ] && [ "$previous_tag" != "$tag" ]; then
    git diff --stat "$previous_tag..$tag" 2>/dev/null
  else
    git diff --stat "$tag" 2>/dev/null
  fi
  echo ""
}

# Rollback to previous version
rollback() {
  echo -e "${RED}⚠️  Rollback will:${NC}"
  echo "  1. Remove the latest tag"
  echo "  2. Reset to the previous tag"
  echo ""
  
  # Get latest tag
  local latest=$(git tag -l "v*" | sort -V | tail -1)
  local previous=$(git tag -l "v*" | sort -V | tail -2 | head -1)
  
  if [ -z "$latest" ]; then
    echo -e "${RED}❌ No tags to rollback${NC}"
    exit 1
  fi
  
  echo -e "  Latest: ${YELLOW}$latest${NC}"
  echo -e "  Previous: ${GREEN}$previous${NC}"
  echo ""
  
  read -p "Continue? (y/N): " -n 1 -r
  echo ""
  
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Delete the latest tag
    git tag -d $latest
    
    # If previous tag exists, checkout that version
    if [ -n "$previous" ]; then
      git checkout $previous -- . 2>/dev/null || true
      echo -e "${GREEN}✅ Rolled back to $previous${NC}"
    else
      echo -e "${YELLOW}⚠️  No previous version to rollback to${NC}"
    fi
    
    echo -e "${YELLOW}⚠️  Review changes and commit if needed${NC}"
  else
    echo -e "${YELLOW}Cancelled${NC}"
  fi
}

# Show help
show_help() {
  echo -e "${BLUE}TravelHub Version Manager${NC}"
  echo ""
  echo "Usage: $0 <command> [version]"
  echo ""
  echo "Commands:"
  echo -e "  ${GREEN}patch${NC}        - Bump patch version (0.1.0 → 0.1.1)"
  echo -e "  ${GREEN}minor${NC}        - Bump minor version (0.1.0 → 0.2.0)"
  echo -e "  ${GREEN}major${NC}        - Bump major version (0.1.0 → 1.0.0)"
  echo -e "  ${GREEN}tag${NC}          - Create git tag for current version"
  echo -e "  ${GREEN}list${NC}         - List all versions and tags"
  echo -e "  ${GREEN}changelog${NC}    - Show changelog (optional: version number)"
  echo -e "  ${GREEN}rollback${NC}     - Rollback to previous version"
  echo ""
  echo "Examples:"
  echo "  $0 patch              # Bump 0.1.0 → 0.1.1"
  echo "  $0 minor              # Bump 0.1.0 → 0.2.0"
  echo "  $0 tag                # Save current version as git tag"
  echo "  $0 list               # Show all versions"
  echo "  $0 changelog          # Show full changelog"
  echo "  $0 changelog 0.1.0    # Show changes for v0.1.0"
  echo "  $0 rollback           # Go back to previous version"
}

# Main
case "${1:-}" in
  major|minor|patch)
    bump $1
    create_tag
    ;;
  tag)
    create_tag
    ;;
  list)
    list_versions
    ;;
  changelog)
    show_changelog "${2:-}"
    ;;
  rollback)
    rollback
    ;;
  *)
    show_help
    ;;
esac
