# Deployment Setup Script for Windows PowerShell
# Automates the setup process for deployment

Write-Host "🚀 Starting deployment setup..." -ForegroundColor Blue

# Step 1: Check Node.js
Write-Host "`n📦 Checking Node.js..." -ForegroundColor Blue
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Yellow
    exit 1
}

# Step 2: Check Git
Write-Host "`n📦 Checking Git..." -ForegroundColor Blue
try {
    $gitVersion = git --version
    Write-Host "✅ Git installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git not found. Please install Git first." -ForegroundColor Yellow
    exit 1
}

# Step 3: Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Blue
if (Test-Path "package.json") {
    npm install
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ package.json not found" -ForegroundColor Yellow
    exit 1
}

# Step 4: Check if git repository is initialized
Write-Host "`n📦 Checking Git repository..." -ForegroundColor Blue
if (Test-Path ".git") {
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
    
    # Check if remote is set
    try {
        $remoteUrl = git remote get-url origin 2>$null
        if ($remoteUrl) {
            Write-Host "✅ Git remote configured: $remoteUrl" -ForegroundColor Green
        } else {
            Write-Host "⚠️  No remote repository configured" -ForegroundColor Yellow
            Write-Host "   Run: git remote add origin <your-github-url>" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  No remote repository configured" -ForegroundColor Yellow
        Write-Host "   Run: git remote add origin <your-github-url>" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Git repository not initialized" -ForegroundColor Yellow
    Write-Host "   Initializing git repository..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "Initial commit - ready for deployment"
    Write-Host "   Run: git remote add origin <your-github-url>" -ForegroundColor Yellow
}

# Step 5: Generate session secret
Write-Host "`n🔐 Generating session secret..." -ForegroundColor Blue
$sessionSecret = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
Write-Host "✅ Session Secret generated:" -ForegroundColor Green
Write-Host $sessionSecret -ForegroundColor Yellow
Write-Host "💡 Add this to your deployment platform as SESSION_SECRET" -ForegroundColor Blue

# Step 6: Run preparation script
Write-Host "`n📋 Running deployment checks..." -ForegroundColor Blue
if (Test-Path "deploy-prepare.js") {
    node deploy-prepare.js
} else {
    Write-Host "⚠️  deploy-prepare.js not found" -ForegroundColor Yellow
}

# Step 7: Check .gitignore
Write-Host "`n📋 Checking .gitignore..." -ForegroundColor Blue
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    if ($gitignoreContent -match "\.env") {
        Write-Host "✅ .env is in .gitignore" -ForegroundColor Green
    } else {
        Write-Host "⚠️  .env not in .gitignore - adding it" -ForegroundColor Yellow
        Add-Content ".gitignore" ".env"
    }
} else {
    Write-Host "⚠️  .gitignore not found - creating it" -ForegroundColor Yellow
    @"
node_modules/
.env
uploads/*
"@ | Out-File -FilePath ".gitignore" -Encoding utf8
}

Write-Host "`n✅ Deployment setup complete!" -ForegroundColor Green
Write-Host "`n📚 Next steps:" -ForegroundColor Blue
Write-Host "   1. git add ." -ForegroundColor Yellow
Write-Host "   2. git commit -m 'Ready for deployment'" -ForegroundColor Yellow
Write-Host "   3. git push origin main" -ForegroundColor Yellow
Write-Host "   4. Sign up at render.com" -ForegroundColor Blue
Write-Host "   5. Create new Web Service and connect your repo"
Write-Host "   6. Add environment variables (see above for SESSION_SECRET)"
Write-Host "`n🎉 Ready to deploy!" -ForegroundColor Green

