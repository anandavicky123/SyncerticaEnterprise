export default function LandingPage() {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `
<!doctype html>
<html lang="en" class="scroll-smooth">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Syncertica Enterprise – DevOps • Chat • Tasks</title>
    <meta name="description" content="Syncertica Enterprise: a modern enterprise platform for DevOps, team chat, and worker task management." />

    <!-- Tailwind CSS via CDN (for quick demo). Replace with build pipeline for production. -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      // Tailwind config (extend colors + container)
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              brand: {
                50: '#eef9ff',
                100: '#d6f0ff',
                200: '#b6e5ff',
                300: '#86d6ff',
                400: '#49c0ff',
                500: '#1497f2',
                600: '#0f75c0',
                700: '#0d5e99',
                800: '#0d4c7a',
                900: '#0d3f65',
              },
            },
            boxShadow: {
              soft: '0 8px 30px rgba(2,12,27,0.08)',
            },
          },
          container: {
            center: true,
            padding: {
              DEFAULT: '0rem',
              sm: '0rem',
              lg: '0rem',
              xl: '0rem',
            },
            screens: {
              '2xl': '1200px',
            },
          },
        },
        darkMode: 'class',
      };
    </script>

    <!-- Inter font -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
      :root { --ring: 0 0% 0%; }
      html { font-family: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'; }
      .glass { backdrop-filter: blur(10px); background: linear-gradient(180deg, rgba(255,255,255,0.65), rgba(255,255,255,0.45)); }
      .dark .glass { background: linear-gradient(180deg, rgba(10,14,23,0.6), rgba(10,14,23,0.4)); }
      .gradient { background: radial-gradient(1200px 600px at 10% -10%, rgba(20,151,242,0.25), transparent 60%),
                  radial-gradient(800px 400px at 90% 10%, rgba(20,151,242,0.15), transparent 60%); }
      .dark .gradient { background: radial-gradient(1200px 600px at 10% -10%, rgba(20,151,242,0.2), transparent 60%),
                         radial-gradient(800px 400px at 90% 10%, rgba(20,151,242,0.1), transparent 60%); }
      .shine { background: linear-gradient(110deg, rgba(255,255,255,0.1), rgba(255,255,255,0) 40%); }
    </style>
  </head>

  <body class="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 gradient" style="margin: 0; padding: 0; width: 100vw; overflow-x: hidden;">
    <!-- ===== NAVBAR ===== -->
    <header class="sticky top-0 z-50 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/50 glass">
      <nav class="container flex items-center justify-between py-3">
        <a href="#home" class="group inline-flex items-center gap-2">
          <span class="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-white shadow-soft">
            <!-- Minimal logo -->
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12h6l3-8 3 8h6" />
              <path d="M3 12l9 9 9-9" />
            </svg>
          </span>
          <span class="font-extrabold tracking-tight text-xl">Syncertica Enterprise</span>
        </a>

        <div class="hidden md:flex items-center gap-8">
          <a href="#features" class="hover:text-brand-600">Features</a>
          <a href="#how" class="hover:text-brand-600">How it works</a>
          <a href="#pricing" class="hover:text-brand-600">Pricing</a>
          <a href="#faq" class="hover:text-brand-600">FAQ</a>
        </div>

        <div class="flex items-center gap-2">
          <a href="/login" class="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-brand-700">Enter Dashboard</a>
          <button id="menuBtn" class="md:hidden rounded-xl border border-slate-200/70 dark:border-slate-800/70 p-2" aria-label="Open menu">
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>
      <div id="mobileMenu" class="md:hidden hidden border-t border-slate-200/60 dark:border-slate-800/60">
        <div class="container py-3 grid gap-3">
          <a href="#features" class="py-2">Features</a>
          <a href="#how" class="py-2">How it works</a>
          <a href="#pricing" class="py-2">Pricing</a>
          <a href="#faq" class="py-2">FAQ</a>
          <a href="/dashboard" class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900">Enter Dashboard</a>
          </div>
      </div>
    </header>

    <!-- ===== HERO ===== -->
    <section id="home" class="relative overflow-hidden">
      <div class="container relative py-20 md:py-28">
        <div class="grid items-center gap-10 md:grid-cols-2">
          <div class="space-y-6">
            <p class="inline-flex items-center gap-2 rounded-full border border-brand-200/60 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-800/60 dark:bg-slate-900 dark:text-brand-200">
              <span class="inline-block h-2 w-2 animate-pulse rounded-full bg-brand-500"></span>
              New: unified DevOps, Chat & Tasks
            </p>
            <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Orchestrate your enterprise in one place
            </h1>
            <p class="text-slate-600 dark:text-slate-300 text-lg">
              Syncertica Enterprise brings <span class="font-semibold">DevOps automation</span>,
              <span class="font-semibold">real‑time team chat</span>, and a <span class="font-semibold">task manager</span>
              together—so ops, engineers, and field workers move faster with fewer tools.
            </p>
            <div class="flex flex-wrap items-center gap-3">
              <a href="/login" class="rounded-xl bg-slate-900 px-5 py-3 text-white hover:opacity-95 dark:bg-white dark:text-slate-900 font-semibold shadow-soft">Try Demo</a>
              <a href="#features" class="rounded-xl border border-slate-300 px-5 py-3 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900 font-semibold">See features</a>
            </div>
            <div class="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <div class="inline-flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-emerald-500"></span>99.95% uptime</div>
              <div class="inline-flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-brand-500"></span>Secure AWS database support</div>
              <div class="inline-flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-indigo-500"></span>Real-time task notifications</div>
            </div>
          </div>

          <!-- Mockup card -->
          <div class="relative">
            <div class="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-950 shadow-soft overflow-hidden">
              <div class="p-4 border-b border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between">
                <div class="text-sm font-semibold">Syncertica Console</div>
                <div class="flex gap-2 opacity-60">
                  <span class="inline-block h-2.5 w-2.5 rounded-full bg-rose-400"></span>
                  <span class="inline-block h-2.5 w-2.5 rounded-full bg-amber-400"></span>
                  <span class="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
                </div>
              </div>
              <div class="grid md:grid-cols-3">
                <div class="md:col-span-1 p-4 border-r border-slate-200/70 dark:border-slate-800/70 bg-slate-50/60 dark:bg-slate-900/40">
                  <ul class="space-y-2 text-sm">
                    <li class="font-semibold text-slate-900 dark:text-slate-100">DevOps</li>
                    <li class="text-slate-600 dark:text-slate-300">Pipelines</li>
                    <li class="text-slate-600 dark:text-slate-300">Infra</li>
                    <li class="text-slate-600 dark:text-slate-300">Repos</li>
                    <li class="text-slate-600 dark:text-slate-300">Container</li>
                    <li class="pt-2 font-semibold text-slate-900 dark:text-slate-100">Chat</li>
                    <li class="text-slate-600 dark:text-slate-300">Notifications</li>
                    <li class="text-slate-600 dark:text-slate-300">Chats</li>
                    <li class="pt-2 font-semibold text-slate-900 dark:text-slate-100">Tasks</li>
                    <li class="text-slate-600 dark:text-slate-300">Boards</li>
                    <li class="text-slate-600 dark:text-slate-300">Statistics</li>
                  </ul>
                </div>
                <div class="md:col-span-2 p-4">
                  <div class="grid gap-4">
                    <div class="rounded-xl border border-slate-200/70 dark:border-slate-800/70 p-4">
                      <div class="text-sm font-semibold mb-2">Pipeline • build-and-deploy.yaml</div>
                      <div class="h-2 w-full rounded bg-slate-200/70 dark:bg-slate-800/70 overflow-hidden">
                        <div class="h-full w-2/3 bg-emerald-500"></div>
                      </div>
                      <div class="mt-2 text-xs text-slate-500">Passing • 12m ago • #248</div>
                    </div>
                    <div class="rounded-xl border border-slate-200/70 dark:border-slate-800/70 p-4">
                      <div class="text-sm font-semibold mb-2">Chat • ops-incident-42</div>
                      <div class="space-y-2 text-sm">
                        <div class="flex items-start gap-2">
                          <span class="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-brand-500"></span>
                          <p><span class="font-semibold">Nadia:</span> Deploy succeeded on canary. Watching metrics…</p>
                        </div>
                        <div class="flex items-start gap-2">
                          <span class="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                          <p><span class="font-semibold">Rizal:</span> Error budget intact. Rolling to 25%.</p>
                        </div>
                      </div>
                    </div>
                    <div class="rounded-xl border border-slate-200/70 dark:border-slate-800/70 p-4">
                      <div class="text-sm font-semibold mb-2">Tasks • Field team</div>
                      <ul class="text-sm space-y-1">
                        <li>☑ Replace IoT gateway (Plant 2)</li>
                        <li>☐ Finish safety checklist (Line A)</li>
                        <li>☐ Validate batch 321 QA report</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="pointer-events-none absolute -top-6 -right-6 h-40 w-40 rounded-3xl bg-brand-500/10 blur-2xl"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== TRUST / LOGOS ===== -->
    <section class="container py-10 md:py-14">
      <div class="flex flex-wrap items-center justify-center gap-8 opacity-70">
        <span class="text-sm">Trusted by teams in manufacturing, fintech, and logistics</span>
        <div class="h-6 w-px bg-slate-300/60 dark:bg-slate-700/60"></div>
        <div class="flex items-center gap-8 text-xs">
          <span class="font-semibold">Kinetiq</span>
          <span class="font-semibold">Nordwave</span>
          <span class="font-semibold">Pramana</span>
          <span class="font-semibold">Azura</span>
        </div>
      </div>
    </section>

    <!-- ===== FEATURES ===== -->
    <section id="features" class="container py-16 md:py-24">
      <div class="mx-auto max-w-3xl text-center">
        <h2 class="text-3xl font-extrabold tracking-tight sm:text-4xl">Three cores. One platform.</h2>
        <p class="mt-3 text-slate-600 dark:text-slate-300">Everything your enterprise needs to ship, talk, and execute—without context switching.</p>
      </div>

      <div class="mt-10 grid gap-6 md:grid-cols-3">
        <!-- DevOps Card -->
        <article class="feature-card reveal rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-950 p-6 shadow-soft">
          <div class="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200">
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 0 1-9 9" />
              <path d="M3 12a9 9 0 0 1 9-9" />
              <path d="M8 12h8" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold">DevOps</h3>
          <p class="mt-2 text-slate-600 dark:text-slate-300">Infrastructure as code, automated pipelines, and cloud-native workflows. Ready to go!</p>
          <ul class="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>• GitHub Actions & AWS</li>
            <li>• Terraform provisioning</li>
            <li>• Dockerized environments</li>
          </ul>
        </article>

        <!-- Chat Card -->
        <article class="feature-card reveal rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-950 p-6 shadow-soft">
          <div class="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200">
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold">Direct Messaging & Notifications</h3>
          <p class="mt-2 text-slate-600 dark:text-slate-300">Stay in sync with conversations that turn into action.</p>
          <ul class="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>• Convert messages into tasks for follow-through</li>
            <li>• Person-to-person messaging</li>
            <li>• Lightweight, always-on communication</li>
          </ul>
        </article>

        <!-- Tasks Card -->
        <article class="feature-card reveal rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-950 p-6 shadow-soft">
          <div class="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200">
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5l-4 4V6a2 2 0 0 1 2-2h9" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold">Task Manager</h3>
          <p class="mt-2 text-slate-600 dark:text-slate-300">Boards and lists built for field operations and engineering execution.</p>
          <ul class="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>• Boards, lists, and real-time charts</li>
            <li>• Role-based approvals</li>
            <li>• Mobile-friendly worker flows</li>
          </ul>
        </article>
      </div>
    </section>

    <!-- ===== HOW IT WORKS ===== -->
    <section id="how" class="border-y border-slate-200/70 dark:border-slate-800/70 bg-slate-50/60 dark:bg-slate-900/40">
      <div class="container py-16 md:py-20">
        <div class="grid gap-8 md:grid-cols-3">
          <div class="reveal">
            <h4 class="text-sm font-semibold text-brand-700 dark:text-brand-300">01 • Connect</h4>
            <h3 class="text-2xl font-bold">Integrate with your tools</h3>
            <p class="mt-2 text-slate-600 dark:text-slate-300">Work seamlessly with AWS databases (RDS, DynamoDB), GitHub Actions, Terraform, and Docker.</p>
          </div>
          <div class="reveal">
            <h4 class="text-sm font-semibold text-brand-700 dark:text-brand-300">02 • Automate</h4>
            <h3 class="text-2xl font-bold">Automate workflows</h3>
            <p class="mt-2 text-slate-600 dark:text-slate-300">Run pipelines with GitHub Actions, manage infrastructure with Terraform, and ship consistently with Dockerized environments.</p>
          </div>
          <div class="reveal">
            <h4 class="text-sm font-semibold text-brand-700 dark:text-brand-300">03 • Execute</h4>
            <h3 class="text-2xl font-bold">Collaborate & track</h3>
            <p class="mt-2 text-slate-600 dark:text-slate-300">Chat in context, use sticky notes to capture ideas, and stay aligned with real-time dashboards and charts.</p>
          </div>
        </div>
      </div>
    </section>


    <!-- ===== PRICING ===== -->
    <section id="pricing" class="container py-16 md:py-24">
      <div class="mx-auto max-w-3xl text-center">
        <h2 class="text-3xl font-extrabold tracking-tight sm:text-4xl">Simple, scalable pricing</h2>
        <p class="mt-3 text-slate-600 dark:text-slate-300">Start free. Upgrade when your team is ready.</p>
      </div>

      <div class="mt-10 grid gap-6 md:grid-cols-3">
        <!-- Free -->
        <div class="reveal rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-950 p-6 shadow-soft">
          <h3 class="text-xl font-semibold">Starter</h3>
          <p class="mt-1 text-slate-600 dark:text-slate-300">For small teams testing the waters</p>
          <div class="mt-4 text-3xl font-extrabold">$0<span class="text-base font-medium text-slate-500">/user</span></div>
          <ul class="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>• 7 users</li>
            <li>• Basic CI/CD templates</li>
            <li>• Team chat & boards</li>
          </ul>
          <a href="login" class="mt-6 inline-block rounded-xl bg-slate-900 px-4 py-2 text-white dark:bg-white dark:text-slate-900 font-semibold">Get started</a>
        </div>
        <!-- Pro -->
        <div class="reveal rounded-2xl border-2 border-brand-500 bg-white dark:bg-slate-950 p-6 shadow-soft">
          <div class="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-200">Most popular</div>
          <h3 class="mt-2 text-xl font-semibold">Growth</h3>
          <p class="mt-1 text-slate-600 dark:text-slate-300">For teams scaling delivery</p>
          <div class="mt-4 text-3xl font-extrabold">$12<span class="text-base font-medium text-slate-500">/user</span></div>
          <ul class="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>• Unlimited users</li>
            <li>• Advanced performance</li>
            <li>• Prioritized customer service</li>
            <li>• Database migration</li>
          </ul>
          <a href="#cta" class="mt-6 inline-block rounded-xl bg-brand-600 px-4 py-2 text-white font-semibold hover:bg-brand-700">Start free trial</a>
        </div>
        <!-- Enterprise -->
        <div class="reveal rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-950 p-6 shadow-soft">
          <h3 class="text-xl font-semibold">Enterprise</h3>
          <p class="mt-1 text-slate-600 dark:text-slate-300">For regulated & complex orgs</p>
          <div class="mt-4 text-3xl font-extrabold">Custom</div>
          <ul class="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>• SAML/SCIM, SOC2, ISO</li>
            <li>• Dedicated VPC & SLAs</li>
            <li>• Custom server</li>
            <li>• Additional repositories</li>
          </ul>
          <a href="#cta" class="mt-6 inline-block rounded-xl border border-slate-300 px-4 py-2 font-semibold dark:border-slate-700">Contact sales</a>
        </div>
      </div>
    </section>

    <!-- ===== FAQ ===== -->
    <section id="faq" class="container py-16 md:py-24">
      <div class="mx-auto max-w-3xl text-center">
        <h2 class="text-3xl font-extrabold tracking-tight sm:text-4xl">Frequently asked questions</h2>
      </div>

      <div class="mt-10 grid gap-4 md:grid-cols-2">
        <details class="reveal group rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-950 p-5 shadow-soft">
          <summary class="cursor-pointer list-none font-semibold">Do you support AWS/GCP/Azure?</summary>
          <p class="mt-2 text-slate-600 dark:text-slate-300">We currently support AWS on both Free and Premium plans. Customers on the Enterprise plan may request support for additional cloud providers, including Azure and GCP, as well as multiple cloud servers.</p>
        </details>
        <details class="reveal group rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-950 p-5 shadow-soft">
          <summary class="cursor-pointer list-none font-semibold">Can we migrate from Slack/Jira?</summary>
          <p class="mt-2 text-slate-600 dark:text-slate-300">Yes, migration from Slack and Jira is available for customers on the Premium plan.</p>
        </details>
        <details class="reveal group rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-950 p-5 shadow-soft">
          <summary class="cursor-pointer list-none font-semibold">Is there on‑prem or private cloud?</summary>
          <p class="mt-2 text-slate-600 dark:text-slate-300">Yes. Enterprise customers can deploy into a private VPC with peering and custom KMS keys.</p>
        </details>
        <details class="reveal group rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-950 p-5 shadow-soft">
          <summary class="cursor-pointer list-none font-semibold">How does pricing work?</summary>
          <p class="mt-2 text-slate-600 dark:text-slate-300">Per active user per month for Growth. Enterprise is volume‑based with advanced security & support.</p>
        </details>
      </div>
    </section>

    <!-- ===== FOOTER ===== -->
    <footer class="border-t border-slate-200/70 dark:border-slate-800/70">
      <div class="container py-10 grid gap-8 md:grid-cols-3">
        <div>
          <div class="inline-flex items-center gap-2">
            <span class="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-white shadow-soft">
              <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12h6l3-8 3 8h6" />
                <path d="M3 12l9 9 9-9" />
              </svg>
            </span>
            <span class="font-extrabold tracking-tight text-xl">Syncertica Enterprise</span>
          </div>
          <p class="mt-3 text-sm text-slate-600 dark:text-slate-300">© <span id="year"></span> Syncertica. All rights reserved.</p>
        </div>
        <div class="grid grid-cols-2 gap-6 text-sm">
          <div>
            <div class="font-semibold mb-2">Product</div>
            <ul class="space-y-1 text-slate-600 dark:text-slate-300">
              <li><a href="#features" class="hover:underline">Features</a></li>
              <li><a href="#pricing" class="hover:underline">Pricing</a></li>
              <li><a href="#faq" class="hover:underline">FAQ</a></li>
            </ul>
          </div>
          <div>
            <div class="font-semibold mb-2">Company</div>
            <ul class="space-y-1 text-slate-600 dark:text-slate-300">
              <li><a href="#" class="hover:underline">About</a></li>
              <li><a href="#" class="hover:underline">Careers</a></li>
              <li><a href="#" class="hover:underline">Contact</a></li>
            </ul>
          </div>
        </div>
        <div class="text-sm text-slate-600 dark:text-slate-300">
          <div class="font-semibold mb-2">Compliance</div>
          <p>GDPR • CCPA • ISO 27001 • SOC2 (in progress)</p>
        </div>
      </div>
    </footer>

    <!-- ===== TypeScript (executed as JS with type-checking hints) ===== -->
    <script type="module">
      // @ts-check
      /**
       * Minimal interactive logic in TypeScript style (JSDoc types for browsers).
       * This executes as standard ES modules; the JSDoc comments enable TS tooling.
       */

      /** @type {HTMLButtonElement | null} */
      const themeToggle = document.querySelector('#themeToggle');
      /** @type {HTMLButtonElement | null} */
      const menuBtn = document.querySelector('#menuBtn');
      /** @type {HTMLDivElement | null} */
      const mobileMenu = document.querySelector('#mobileMenu');
      /** @type {HTMLSpanElement | null} */
      const year = document.querySelector('#year');

      // Persisted theme: light/dark based on localStorage + system preference
      const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const savedTheme = localStorage.getItem('se-theme');
      const isDark = savedTheme ? savedTheme === 'dark' : preferDark;
      document.documentElement.classList.toggle('dark', isDark);

      themeToggle?.addEventListener('click', () => {
        const on = !document.documentElement.classList.contains('dark');
        document.documentElement.classList.toggle('dark', on);
        localStorage.setItem('se-theme', on ? 'dark' : 'light');
      });

      menuBtn?.addEventListener('click', () => {
        mobileMenu?.classList.toggle('hidden');
      });

      if (year) year.textContent = String(new Date().getFullYear());

      // Simple scroll-reveal animation using IntersectionObserver
      /** @type {IntersectionObserver} */
      const observer = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add('translate-y-0', 'opacity-100');
              observer.unobserve(e.target);
            }
          }
        },
        { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
      );

      /** @type {NodeListOf<Element>} */
      const reveals = document.querySelectorAll('.reveal');
      for (const el of reveals) {
        el.classList.add('opacity-0', 'translate-y-4', 'transition', 'duration-700');
        observer.observe(el);
      }

      // Smooth anchor scrolling is handled by .scroll-smooth on <html>
    </script>
  </body>
</html>
      `,
      }}
    />
  );
}
