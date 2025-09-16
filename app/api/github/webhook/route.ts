import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// GitHub webhook events interface
interface GitHubWebhookEvent {
  action?: string;
  sender: {
    login: string;
    id: number;
  };
  repository?: {
    id: number;
    name: string;
    full_name: string;
    owner: {
      login: string;
    };
  };
  installation?: {
    id: number;
    account: {
      login: string;
    };
  };
  workflow_run?: {
    id: number;
    name: string;
    head_branch: string;
    head_sha: string;
    status: string;
    conclusion: string | null;
    workflow_id: number;
    url: string;
    html_url: string;
  };
  workflow_job?: {
    id: number;
    run_id: number;
    workflow_name: string;
    head_branch: string;
    status: string;
    conclusion: string | null;
    started_at: string;
    completed_at: string | null;
  };
}

/**
 * Verify GitHub webhook signature
 */
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload, 'utf8');
  const digest = `sha256=${hmac.digest('hex')}`;
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

/**
 * GitHub App Webhook Endpoint
 * 
 * This endpoint receives events from GitHub when:
 * - App is installed/uninstalled on repositories
 * - Workflow runs are triggered
 * - Repository events occur
 * - Other GitHub App events
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const payload = await request.text();
    
    // Get headers
    const signature = request.headers.get('x-hub-signature-256');
    const event = request.headers.get('x-github-event');
    const delivery = request.headers.get('x-github-delivery');
    
    console.log('GitHub Webhook received:', {
      event,
      delivery,
      timestamp: new Date().toISOString(),
      hasSignature: !!signature,
      payloadLength: payload.length
    });
    
    // Verify signature if webhook secret is configured
    const webhookSecret = process.env.GITHUB_APP_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      if (!verifySignature(payload, signature, webhookSecret)) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
      console.log('✅ Webhook signature verified');
    } else if (!webhookSecret) {
      console.warn('⚠️ No webhook secret configured - signature verification skipped');
    }
    
    // Parse the payload
    let data: GitHubWebhookEvent;
    try {
      data = JSON.parse(payload);
    } catch (parseError) {
      console.error('Failed to parse webhook payload:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }
    
    // Handle different GitHub events
    switch (event) {
      case 'installation':
        await handleInstallationEvent(data);
        break;
        
      case 'installation_repositories':
        await handleInstallationRepositoriesEvent(data);
        break;
        
      case 'workflow_run':
        await handleWorkflowRunEvent(data);
        break;
        
      case 'workflow_job':
        await handleWorkflowJobEvent(data);
        break;
        
      case 'push':
        await handlePushEvent(data);
        break;
        
      case 'pull_request':
        await handlePullRequestEvent(data);
        break;
        
      case 'repository':
        await handleRepositoryEvent(data);
        break;
        
      default:
        console.log(`Unhandled event type: ${event}`);
        break;
    }
    
    return NextResponse.json({ 
      status: 'success',
      event,
      delivery,
      message: 'Webhook processed successfully'
    });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle GitHub App installation events
 */
async function handleInstallationEvent(data: GitHubWebhookEvent) {
  const { action, installation, sender } = data;
  
  console.log(`GitHub App ${action} by ${sender.login}`, {
    installationId: installation?.id,
    account: installation?.account?.login
  });
  
  switch (action) {
    case 'created':
      console.log('✅ GitHub App installed successfully');
      // TODO: Store installation in database
      // TODO: Sync repositories for this installation
      break;
      
    case 'deleted':
      console.log('❌ GitHub App uninstalled');
      // TODO: Remove installation from database
      // TODO: Clean up associated data
      break;
      
    case 'suspend':
      console.log('⏸️ GitHub App suspended');
      break;
      
    case 'unsuspend':
      console.log('▶️ GitHub App unsuspended');
      break;
  }
}

/**
 * Handle installation repositories events
 */
async function handleInstallationRepositoriesEvent(data: GitHubWebhookEvent) {
  const { action, installation } = data;
  
  console.log(`Installation repositories ${action}`, {
    installationId: installation?.id,
    account: installation?.account?.login
  });
  
  // TODO: Update repository access for this installation
}

/**
 * Handle workflow run events
 */
async function handleWorkflowRunEvent(data: GitHubWebhookEvent) {
  const { action, workflow_run, repository } = data;
  
  if (!workflow_run) return;
  
  console.log(`Workflow run ${action}:`, {
    workflow: workflow_run.name,
    status: workflow_run.status,
    conclusion: workflow_run.conclusion,
    branch: workflow_run.head_branch,
    repository: repository?.full_name,
    url: workflow_run.html_url
  });
  
  switch (action) {
    case 'requested':
      console.log('🚀 Workflow run requested');
      break;
      
    case 'in_progress':
      console.log('⏳ Workflow run in progress');
      break;
      
    case 'completed':
      const conclusion = workflow_run.conclusion;
      if (conclusion === 'success') {
        console.log('✅ Workflow run completed successfully');
      } else if (conclusion === 'failure') {
        console.log('❌ Workflow run failed');
      } else if (conclusion === 'cancelled') {
        console.log('⏹️ Workflow run cancelled');
      }
      break;
  }
  
  // TODO: Update workflow status in database
  // TODO: Send notifications to relevant users
}

/**
 * Handle workflow job events
 */
async function handleWorkflowJobEvent(data: GitHubWebhookEvent) {
  const { action, workflow_job } = data;
  
  if (!workflow_job) return;
  
  console.log(`Workflow job ${action}:`, {
    workflow: workflow_job.workflow_name,
    status: workflow_job.status,
    conclusion: workflow_job.conclusion,
    branch: workflow_job.head_branch
  });
  
  // TODO: Update job status in database
}

/**
 * Handle push events
 */
async function handlePushEvent(data: GitHubWebhookEvent) {
  const { repository, sender } = data;
  
  console.log(`Push event by ${sender.login}:`, {
    repository: repository?.full_name
  });
  
  // TODO: Trigger relevant workflows or actions
  // TODO: Update repository information
}

/**
 * Handle pull request events
 */
async function handlePullRequestEvent(data: GitHubWebhookEvent) {
  const { action, repository, sender } = data;
  
  console.log(`Pull request ${action} by ${sender.login}:`, {
    repository: repository?.full_name
  });
  
  // TODO: Handle PR-related actions
}

/**
 * Handle repository events
 */
async function handleRepositoryEvent(data: GitHubWebhookEvent) {
  const { action, repository, sender } = data;
  
  console.log(`Repository ${action} by ${sender.login}:`, {
    repository: repository?.full_name
  });
  
  switch (action) {
    case 'created':
      console.log('📁 Repository created');
      // TODO: Add repository to database
      break;
      
    case 'deleted':
      console.log('🗑️ Repository deleted');
      // TODO: Remove repository from database
      break;
      
    case 'transferred':
      console.log('↔️ Repository transferred');
      // TODO: Update repository ownership
      break;
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'GitHub App Webhook',
    timestamp: new Date().toISOString(),
    webhookUrl: process.env.NEXT_PUBLIC_BASE_URL + '/api/github/webhook',
    environment: process.env.NODE_ENV
  });
}