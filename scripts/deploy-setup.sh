#!/bin/bash

# Deployment Setup Script
# Automates the setup process for deployment

echo "🚀 Starting deployment setup..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check Node.js
echo -e "\n${BLUE}📦 Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js installed: $NODE_VERSION${NC}"
else
    echo -e "${YELLOW}❌ Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi

# Step 2: Check Git
echo -e "\n${BLUE}📦 Checking Git...${NC}"
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo -e "${GREEN}✅ Git installed: $GIT_VERSION${NC}"
else
    echo -e "${YELLOW}❌ Git not found. Please install Git first.${NC}"
    exit 1
fi

# Step 3: Install dependencies
echo -e "\n${BLUE}📦 Installing dependencies...${NC}"
if [ -f "package.json" ]; then
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${YELLOW}❌ package.json not found${NC}"
    exit 1
fi

# Step 4: Check if git repository is initialized
echo -e "\n${BLUE}📦 Checking Git repository...${NC}"
if [ -d ".git" ]; then
    echo -e "${GREEN}✅ Git repository initialized${NC}"
    
    # Check if remote is set
    if git remote get-url origin &> /dev/null; then
        REMOTE_URL=$(git remote get-url origin)
        echo -e "${GREEN}✅ Git remote configured: $REMOTE_URL${NC}"
    else
        echo -e "${YELLOW}⚠️  No remote repository configured${NC}"
        echo -e "${YELLOW}   Run: git remote add origin <your-github-url>${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Git repository not initialized${NC}"
    echo -e "${YELLOW}   Initializing git repository...${NC}"
    git init
    git add .
    git commit -m "Initial commit - ready for deployment"
    echo -e "${YELLOW}   Run: git remote add origin <your-github-url>${NC}"
fi

# Step 5: Generate session secret
echo -e "\n${BLUE}🔐 Generating session secret...${NC}"
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo -e "${GREEN}✅ Session Secret generated:${NC}"
echo -e "${YELLOW}$SESSION_SECRET${NC}"
echo -e "${BLUE}💡 Add this to your deployment platform as SESSION_SECRET${NC}"

# Step 6: Run preparation script
echo -e "\n${BLUE}📋 Running deployment checks...${NC}"
if [ -f "deploy-prepare.js" ]; then
    node deploy-prepare.js
else
    echo -e "${YELLOW}⚠️  deploy-prepare.js not found${NC}"
fi

# Step 7: Check .gitignore
echo -e "\n${BLUE}📋 Checking .gitignore...${NC}"
if [ -f ".gitignore" ]; then
    if grep -q ".env" .gitignore; then
        echo -e "${GREEN}✅ .env is in .gitignore${NC}"
    else
        echo -e "${YELLOW}⚠️  .env not in .gitignore - adding it${NC}"
        echo ".env" >> .gitignore
    fi
else
    echo -e "${YELLOW}⚠️  .gitignore not found - creating it${NC}"
    echo "node_modules/" > .gitignore
    echo ".env" >> .gitignore
    echo "uploads/*" >> .gitignore
fi

echo -e "\n${GREEN}✅ Deployment setup complete!${NC}"
echo -e "\n${BLUE}📚 Next steps:${NC}"
echo -e "   1. ${YELLOW}git add .${NC}"
echo -e "   2. ${YELLOW}git commit -m 'Ready for deployment'${NC}"
echo -e "   3. ${YELLOW}git push origin main${NC}"
echo -e "   4. Sign up at ${BLUE}render.com${NC}"
echo -e "   5. Create new Web Service and connect your repo"
echo -e "   6. Add environment variables (see above for SESSION_SECRET)"
echo -e "\n${GREEN}🎉 Ready to deploy!${NC}"

