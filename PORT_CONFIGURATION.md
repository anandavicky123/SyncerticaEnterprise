# Port Configuration Guide

## Automatic Port Detection

This application now supports **automatic port detection** to handle cases where the default port 3000 is unavailable.

### How it works:

1. **Frontend**: Uses `window.location.origin` to automatically detect the current port
2. **Backend**: Uses `request.url` origin to dynamically determine callback URLs
3. **Environment**: Set to default port 3000, but app adapts to actual running port

### Configuration:

#### .env file (defaults):

```
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

#### OAuth Callback URLs for provider settings:

- **GitHub**: `http://localhost:3000/api/github/callback`
- **GitLab**: `http://localhost:3000/api/gitlab/callback`
- **Bitbucket**: `http://localhost:3000/api/bitbucket/callback`

### Port Flexibility:

If port 3000 is unavailable, Next.js will automatically use 3001, 3002, etc. The application will:

- ✅ Frontend automatically detects the correct port
- ✅ OAuth redirects work with any port
- ✅ API calls use the correct base URL

### OAuth Provider Setup:

When registering OAuth apps, use these callback URLs:

- Primary: `http://localhost:3000/api/{provider}/callback`
- Alternative: Add `http://localhost:3001/api/{provider}/callback` and `http://localhost:3002/api/{provider}/callback` if needed

### Testing:

The application will work regardless of which port Next.js chooses, thanks to dynamic origin detection.
