# 🔑 GitHub Actions API Setup

## Yes, you will need a GitHub Token!

### 🛡️ **GitHub Personal Access Token Required**

The GitHub Actions integration requires a **Personal Access Token** to access the GitHub API and fetch real workflow data.

### 📋 **Setup Steps:**

#### 1. **Create GitHub Token**

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select the following scopes:
   - ✅ `repo` - Full control of private repositories
   - ✅ `workflow` - Update GitHub Action workflows
   - ✅ `read:org` - Read organization data (if needed)

#### 2. **Configure Environment Variables**

Create or update `.env.local` in your project root:

```env
# GitHub Configuration
NEXT_PUBLIC_GITHUB_OWNER=anandavicky123
NEXT_PUBLIC_GITHUB_REPO=syncerticaenterprise
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Increase API rate limits
GITHUB_API_BASE_URL=https://api.github.com
```

#### 3. **Repository Settings**

For triggering workflows, add these secrets to your GitHub repository:

1. Go to Repository Settings → Secrets and variables → Actions
2. Add repository secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`

### 🔐 **API Rate Limits**

- **Without Token**: 60 requests/hour per IP
- **With Token**: 5,000 requests/hour per token
- **Enterprise**: Higher limits available

### ⚡ **Current Features Working:**

#### **✅ Public Repository Access (No Token)**

- Repository information
- Public workflow runs
- Basic pipeline data

#### **🔑 With Token (Recommended)**

- All workflow runs (including private)
- Workflow triggering
- Job details and logs
- Artifact downloads
- Higher rate limits

### 🧪 **Test Integration**

The dashboard is currently working with **limited public access**. Add your token to unlock full features:

1. **Repository Data**: ✅ Working (public access)
2. **Workflow Runs**: ✅ Working (public access)
3. **Pipeline Status**: ✅ Working (real-time)
4. **AWS Integration**: ✅ Working (simulated)
5. **Workflow Triggering**: ❌ Requires token
6. **Private Data**: ❌ Requires token

### 🚀 **After Adding Token:**

The dashboard will show:

- ✅ All workflow runs (including private)
- ✅ Real-time job execution logs
- ✅ Artifact download links
- ✅ Manual workflow triggering
- ✅ Higher refresh rates
- ✅ Full repository access

### 📱 **Demo Mode**

Current setup shows **demo data** until token is configured. Once you add the token, it will switch to **live GitHub Actions data**.

### 🔧 **Quick Setup**

```bash
# 1. Create .env.local file
echo "GITHUB_TOKEN=your_token_here" > .env.local
echo "NEXT_PUBLIC_GITHUB_OWNER=anandavicky123" >> .env.local
echo "NEXT_PUBLIC_GITHUB_REPO=syncerticaenterprise" >> .env.local

# 2. Restart development server
npm run dev
```

### 🎯 **Ready to Connect!**

Once you provide your GitHub token, the DevOps Pipeline will show **real-time GitHub Actions data** from your repository with full AWS integration monitoring!

---

**Need help getting a token? Let me know and I can guide you through the process!**
