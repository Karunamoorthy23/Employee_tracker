# Server Management Guide

## The Port Conflict Problem

On Windows, when you stop a Node.js server with Ctrl+C, the process doesn't always release the port immediately. This causes the `EADDRINUSE` error when you try to restart the server.

## Solutions Provided

### 1. Batch Scripts (Recommended for Windows)

**Start Server with Cleanup:**
```bash
.\start-server.bat
```
This script:
- Kills any existing processes using port 3001
- Waits 2 seconds for port release
- Starts the server

**Stop Server:**
```bash
.\stop-server.bat
```
This script:
- Kills any processes using port 3001
- Confirms server stopped

### 2. PowerShell Scripts (Alternative)

**Start Server:**
```powershell
.\start-server.ps1
```

**Stop Server:**
```powershell
.\stop-server.ps1
```

### 3. NPM Scripts

**Start with cleanup:**
```bash
npm run start:clean
```

**Stop server:**
```bash
npm run stop
```

**Restart server:**
```bash
npm run restart
```

## Manual Port Cleanup (If needed)

If you still encounter issues, manually kill processes:

```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

## Best Practices

1. **Always use the cleanup scripts** instead of direct `npm start`
2. **Use `npm run stop`** before stopping the server
3. **Wait 2-3 seconds** between stop and start operations
4. **Check port status** with `netstat -ano | findstr :3001` if issues persist

## Why This Happens

- Windows doesn't immediately release TCP ports when processes terminate
- Node.js processes can leave "zombie" connections
- The TIME_WAIT state keeps ports occupied for a few minutes
- Multiple server instances can conflict with each other

## Prevention

The provided scripts automatically handle all these issues, so you can start and stop your server without worrying about port conflicts.
