#!/bin/bash

# This script sets up a Git repository for the Smallie-mvp directory
# and configures it to push only to the specified GitHub repository.

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Exit on any error
set -e

echo -e "${BLUE}=========================================================${NC}"
echo -e "${BLUE}     Setting up Git for Smallie-mvp directory     ${NC}"
echo -e "${BLUE}=========================================================${NC}"

# Check if Git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: Git is not installed. Please install Git first.${NC}"
    exit 1
fi

# Check if we're in the Smallie-mvp directory
if [ "$(basename $(pwd))" != "Smallie-mvp" ]; then
  echo -e "${RED}Error: Please run this script from the Smallie-mvp directory.${NC}"
  echo -e "Current directory: $(pwd)"
  echo -e "Run: ${YELLOW}cd Smallie-mvp${NC} and then try again."
  exit 1
fi

echo -e "${GREEN}✓ Running in the correct directory${NC}"

# Check for existing Git repository
if [ -d ".git" ]; then
  echo -e "${YELLOW}Warning: Git repository already exists. Cleaning up...${NC}"
  rm -rf .git
  echo -e "${GREEN}✓ Old Git repository removed${NC}"
fi

# Initialize a new Git repository
echo -e "\n${BLUE}Initializing a new Git repository...${NC}"
git init
echo -e "${GREEN}✓ Git repository initialized${NC}"

# Add the remote repository
echo -e "\n${BLUE}Adding remote repository...${NC}"
GITHUB_REPO="https://github.com/theta-ko/Competition.git"
git remote add origin "$GITHUB_REPO"
echo -e "${GREEN}✓ Remote repository configured: ${YELLOW}$GITHUB_REPO${NC}"

# Create a .gitignore file if it doesn't exist or update existing one
echo -e "\n${BLUE}Setting up .gitignore file...${NC}"
cat > .gitignore << EOF
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
ENV/
env/
.env
.env.local
.env.development
.env.production

# Replit
.breakpoints
.config/
.upm/

# Database
*.db
*.sqlite
*.sqlite3

# Vercel
.vercel

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# System specific
.DS_Store
Thumbs.db
*.swp
*~
EOF
echo -e "${GREEN}✓ .gitignore file updated${NC}"

# Ensure .replit file is not ignored
echo -e "\n${BLUE}Making sure .replit file is tracked...${NC}"
if [ -f ".replit" ]; then
  echo -e "${GREEN}✓ .replit file found${NC}"
else
  echo -e "${YELLOW}Warning: .replit file not found, creating a simple one...${NC}"
  cat > .replit << EOF
modules = ["python-3.11"]

[git]
remote = "$GITHUB_REPO"
defaultBranch = "main"

[nix]
channel = "stable-24_05"

[deployment]
deploymentTarget = "autoscale"
run = ["gunicorn", "--bind", "0.0.0.0:5000", "main:app"]
EOF
  echo -e "${GREEN}✓ Basic .replit file created${NC}"
fi

# Add all files
echo -e "\n${BLUE}Adding all files to Git...${NC}"
git add .
echo -e "${GREEN}✓ All files added to Git${NC}"

# Check if we have files staged for commit
STAGED_FILES=$(git diff --cached --name-only | wc -l)
if [ "$STAGED_FILES" -eq 0 ]; then
  echo -e "${RED}Error: No files staged for commit. Something went wrong.${NC}"
  exit 1
fi

# Make the initial commit
echo -e "\n${BLUE}Creating initial commit...${NC}"
git commit -m "Initial commit of Smallie-mvp application"
echo -e "${GREEN}✓ Initial commit created${NC}"

# Instructions for pushing
echo -e "\n${BLUE}=========================================================${NC}"
echo -e "${GREEN}Git repository setup complete!${NC}"
echo -e "${BLUE}=========================================================${NC}"
echo -e "\nYou can now do one of the following:\n"

echo -e "1. ${YELLOW}Use Replit's Version Control interface:${NC}"
echo -e "   - Click on the Version Control tab in the left sidebar"
echo -e "   - You should see only the Smallie-mvp files listed"
echo -e "   - Click 'Commit & Push'\n"

echo -e "2. ${YELLOW}Push from the command line:${NC}"
echo -e "   git push -u origin main --force\n"

echo -e "${RED}Note: Using --force will overwrite any existing content in the repository.${NC}"
echo -e "${BLUE}For more detailed instructions, see the PUSH_TO_GITHUB_INSTRUCTIONS.md file.${NC}"