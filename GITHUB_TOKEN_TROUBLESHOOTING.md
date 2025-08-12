# GitHub Token Troubleshooting Guide

## Issue Fixed: Cookie Name Mismatch

✅ **RESOLVED**: The API endpoints were looking for `github_token` but the auth system was setting `github_access_token`.

## Current Status

- ✅ Fixed cookie name mismatch in both APIs:
  - `/api/workflows/run/route.ts`
  - `/api/workflows/logs/route.ts`
- ✅ Added comprehensive debugging logs
- ✅ Enhanced error handling in UI

## Testing Steps

### 1. Check GitHub Connection Status

1. Open browser to `http://localhost:3000/dashboard`
2. Look at the Projects section header
3. Should show either "Connected as [username]" or "Disconnected"

### 2. If Disconnected, Reconnect:

1. Click "Connect to GitHub" button in Projects section
2. Or use "Repository" → "Connect to GitHub" from toolbar
3. Complete OAuth flow
4. Should redirect back to dashboard with "Connected" status

### 3. Test Workflow Functionality:

1. Navigate to Projects → CI/CD tab
2. You should see workflow files from your repositories
3. Click the green "Run" button (▶️) on any workflow
4. Check browser console for detailed logs:
   - `🚀 Attempting to run workflow:`
   - `🔑 GitHub token check:`
   - `📝 Request body:`
   - `🔍 Fetching workflows for repository:`
   - `📡 Workflows API response status:`
   - `🎯 Target workflow:`
   - `🚀 Triggering workflow dispatch:`
   - `✅ Workflow triggered successfully`

### 4. Check Browser Console

Open Developer Tools (F12) and look for:

- GitHub connection status logs
- API call logs with emoji prefixes
- Any error messages

### 5. Test Other Features:

1. **Edit Button** (✏️): Should open workflow editor modal
2. **Log Button** (📄): Should show workflow execution history
3. **DevOps Tools Menu**: Should open creation modals

## Common Issues & Solutions

### "GitHub token not found"

- **Cause**: Not connected to GitHub or cookie expired
- **Solution**: Use "Connect to GitHub" button to re-authenticate

### "Workflow not found"

- **Cause**: Workflow file name doesn't match or repository access issue
- **Solution**: Check console logs for available workflows list

### "Failed to fetch workflows: 403"

- **Cause**: Insufficient permissions or token expired
- **Solution**: Reconnect to GitHub with proper scope permissions

### Network errors

- **Cause**: GitHub API rate limiting or network issues
- **Solution**: Wait a few minutes and try again

## Debug Information

The system now logs detailed information to help troubleshoot:

### API Logs (Server Console):

```
🚀 Workflow run API called
🔑 GitHub token check: Found
📝 Request body: {repository: "...", workflow: "..."}
🔍 Fetching workflows for repository: ...
📡 Workflows API response status: 200
📋 Available workflows: [...]
🎯 Target workflow: Found: ...
🚀 Triggering workflow dispatch for: ...
📡 Dispatch response status: 204
✅ Workflow triggered successfully
```

### Browser Console Logs:

```
🚀 Attempting to run workflow: {repository: "...", filename: "..."}
📡 Response status: 200
✅ Workflow triggered: {success: true, message: "..."}
```

## Next Steps

1. Try connecting to GitHub first
2. Verify you have repositories with workflow files
3. Test the Run button on a workflow
4. Check console logs for detailed error information
5. Report specific error messages if issues persist

The system is now much more robust with proper error handling and detailed logging to help identify any remaining issues.
