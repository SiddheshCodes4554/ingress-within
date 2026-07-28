/* =========================================================================
   INGRESS WITHIN — ADMIN OPERATIONS DASHBOARD PROTOTYPE (VANILLA JS)
   Sole Source of Truth: Pure HTML/CSS/JS Product Operations Prototype
========================================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const workspace = document.getElementById('workspace');
  const navItems = document.querySelectorAll('.nav-item');
  const globalSearch = document.getElementById('globalSearch');
  const notifBtn = document.getElementById('notifBtn');
  const notifDropdown = document.getElementById('notifDropdown');
  const profileBtn = document.getElementById('profileBtn');
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');

  // Drawer Elements
  const drawerOverlay = document.getElementById('drawerOverlay');
  const contextDrawer = document.getElementById('contextDrawer');
  const drawerTitle = document.getElementById('drawerTitle');
  const drawerBody = document.getElementById('drawerBody');
  const drawerClose = document.getElementById('drawerClose');

  // Modal Elements
  const modalOverlay = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');

  // Toast Container
  const toastContainer = document.getElementById('toastContainer');

  let currentTab = 'dashboard';

  function navigateTo(tabName) {
    currentTab = tabName;
    navItems.forEach(item => {
      if (item.dataset.tab === tabName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    renderView(tabName);
    window.scrollTo(0, 0);
  }

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = item.dataset.tab;
      navigateTo(tab);
      if (window.innerWidth <= 992) {
        sidebar.classList.remove('mobile-open');
      }
    });
  });

  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('mobile-open');
  });

  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    notifDropdown.classList.toggle('show');
  });

  document.addEventListener('click', () => {
    notifDropdown.classList.remove('show');
  });

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      globalSearch.focus();
    }
  });

  function openDrawer(title, htmlContent) {
    drawerTitle.textContent = title;
    drawerBody.innerHTML = htmlContent;
    drawerOverlay.classList.add('show');
    contextDrawer.classList.add('show');
  }

  function closeDrawer() {
    drawerOverlay.classList.remove('show');
    contextDrawer.classList.remove('show');
  }

  drawerClose.addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('click', closeDrawer);

  function openModal(title, htmlContent) {
    modalTitle.textContent = title;
    modalBody.innerHTML = htmlContent;
    modalOverlay.classList.add('show');
  }

  function closeModal() {
    modalOverlay.classList.remove('show');
  }

  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>✓</span> <div>${message}</div>`;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  window.navigateTo = navigateTo;
  window.openDrawer = openDrawer;
  window.closeDrawer = closeDrawer;
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.showToast = showToast;

  function renderView(tab) {
    switch (tab) {
      case 'dashboard': renderDashboardView(); break;
      case 'users': renderUsersView(); break;
      case 'therapists': renderTherapistsView(); break;
      case 'advisors': renderAdvisorsView(); break;
      case 'subscriptions': renderSubscriptionsView(); break;
      case 'payments': renderPaymentsView(); break;
      case 'interventions': renderInterventionsView(); break;
      case 'knowledge-base': renderKnowledgeBaseView(); break;
      case 'vocabulary': renderVocabularyView(); break;
      case 'patterns': renderPatternsView(); break;
      case 'reports': renderReportsView(); break;
      case 'exercises': renderExercisesView(); break;
      case 'ai-usage': renderAiUsageView(); break;
      case 'support': renderSupportView(); break;
      case 'notifications': renderNotificationsView(); break;
      case 'system-health': renderSystemHealthView(); break;
      case 'audit-logs': renderAuditLogsView(); break;
      case 'settings': renderSettingsView(); break;
      default: renderDashboardView();
    }
  }

  // 1. DASHBOARD VIEW
  function renderDashboardView() {
    workspace.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Product Operations Overview</h1>
          <p>Real-time platform metrics, active user behavior, AI telemetry, and system health status.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" onclick="showToast('Refreshing live metrics...')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Refresh Metrics
          </button>
          <button class="btn btn-primary" onclick="showToast('Exporting executive report...')">Export Report</button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="card">
          <div class="stat-card-title">Total Members</div>
          <div class="stat-card-value">1,420</div>
          <div class="stat-card-change up">↑ +14.2% this month</div>
        </div>
        <div class="card">
          <div class="stat-card-title">Active Daily Users</div>
          <div class="stat-card-value">384</div>
          <div class="stat-card-change up">↑ +8.1% vs last week</div>
        </div>
        <div class="card">
          <div class="stat-card-title">Today's Journals</div>
          <div class="stat-card-value">142</div>
          <div class="stat-card-change up">↑ 88% response rate</div>
        </div>
        <div class="card">
          <div class="stat-card-title">Weekly Reports Generated</div>
          <div class="stat-card-value">342</div>
          <div class="stat-card-change up">✓ 100% queue success</div>
        </div>
        <div class="card">
          <div class="stat-card-title">AI Tokens (Today)</div>
          <div class="stat-card-value">1.4M</div>
          <div class="stat-card-change down">↓ $14.20 estimated cost</div>
        </div>
        <div class="card">
          <div class="stat-card-title">Monthly Revenue (MRR)</div>
          <div class="stat-card-value">$42,850</div>
          <div class="stat-card-change up">↑ +18.5% YoY</div>
        </div>
        <div class="card">
          <div class="stat-card-title">Active Subscriptions</div>
          <div class="stat-card-value">1,120</div>
          <div class="stat-card-change up">92.4% renewal rate</div>
        </div>
        <div class="card">
          <div class="stat-card-title">Trial Users</div>
          <div class="stat-card-value">300</div>
          <div class="stat-card-change up">42% conversion rate</div>
        </div>
        <div class="card">
          <div class="stat-card-title">Verified Therapists</div>
          <div class="stat-card-value">24</div>
          <div class="stat-card-change up">184 assigned clients</div>
        </div>
        <div class="card">
          <div class="stat-card-title">Advisors</div>
          <div class="stat-card-value">12</div>
          <div class="stat-card-change up">68 recommendations</div>
        </div>
        <div class="card">
          <div class="stat-card-title">Interventions Used</div>
          <div class="stat-card-value">894</div>
          <div class="stat-card-change up">Reframing cards top</div>
        </div>
        <div class="card">
          <div class="stat-card-title">Platform Health</div>
          <div class="stat-card-value" style="color:var(--emerald);">99.98%</div>
          <div class="stat-card-change up">Zero downtime</div>
        </div>
      </div>

      <div class="card" style="border-left: 3px solid var(--amber); margin-bottom: 24px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <span class="badge badge-amber" style="margin-bottom:6px;">ATTENTION REQUIRED</span>
            <h4 style="font-weight:600; font-size:13px; color:var(--text-main);">Therapist Verification Backlog</h4>
            <p style="font-size:11px; color:var(--text-muted);">3 therapists are pending credential verification and client assignments.</p>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="navigateTo('therapists')">Review Therapists</button>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 2fr 1fr; gap:24px;">
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h3 style="font-family:var(--font-serif); font-size:16px; font-weight:400;">Recent Operational Activity</h3>
            <span class="badge badge-subtle">Live Updates</span>
          </div>

          <div style="space-y:14px;">
            <div style="display:flex; gap:12px; padding:10px 0; border-bottom:1px solid var(--border-color);">
              <div style="width:28px; height:28px; border-radius:50%; background:rgba(16,185,129,0.15); color:var(--emerald); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:10px;">EX</div>
              <div>
                <p style="font-weight:600; font-size:12px;">User #1042 Completed Exercise 3 (Self Perception)</p>
                <p style="font-size:11px; color:var(--text-muted);">AI Worker synthesised 3-sentence prose with Gap Score 2/5 (Moderate Divergence).</p>
                <span style="font-size:10px; color:var(--text-faint);">12 minutes ago</span>
              </div>
            </div>
            <div style="display:flex; gap:12px; padding:10px 0; border-bottom:1px solid var(--border-color);">
              <div style="width:28px; height:28px; border-radius:50%; background:rgba(184,168,212,0.15); color:var(--iris); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:10px;">RP</div>
              <div>
                <p style="font-weight:600; font-size:12px;">Weekly Report Batch #204 Dispatched</p>
                <p style="font-size:11px; color:var(--text-muted);">Generated 342 user reports via Groq Llama-3.3-70b in 4.2 seconds total.</p>
                <span style="font-size:10px; color:var(--text-faint);">45 minutes ago</span>
              </div>
            </div>
            <div style="display:flex; gap:12px; padding:10px 0;">
              <div style="width:28px; height:28px; border-radius:50%; background:rgba(224,168,152,0.15); color:var(--terra); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:10px;">TH</div>
              <div>
                <p style="font-weight:600; font-size:12px;">Therapist Dr. Sarah Jenkins Accepted Assignment</p>
                <p style="font-size:11px; color:var(--text-muted);">Assigned to client #1088 with read-only report access granted.</p>
                <span style="font-size:10px; color:var(--text-faint);">2 hours ago</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div style="margin-bottom:16px;">
            <span class="badge badge-todo" style="margin-bottom:8px;">FOUNDER DECISION REQUIRED</span>
            <h3 style="font-family:var(--font-serif); font-size:15px; font-weight:400; color:var(--iris);">Exercise 4 Unlock Criteria</h3>
          </div>
          <p style="font-size:11px; color:var(--text-muted); line-height:1.6; margin-bottom:16px;">
            Should Exercise 4 (Cognitive Reframing) unlock strictly on Day 30 or immediately upon completion of Exercise 3?
          </p>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <button class="btn btn-secondary btn-sm" onclick="showToast('Selected: Strict Day 30 Unlock')">Option A: Strict Day 30 Unlock</button>
            <button class="btn btn-secondary btn-sm" onclick="showToast('Selected: Progressive Sequence Unlock')">Option B: Progressive Sequence</button>
          </div>
        </div>
      </div>
    `;
  }

  // 2. USER MANAGEMENT VIEW
  function renderUsersView() {
    workspace.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>User Management</h1>
          <p>Monitor member activity, psychological risk levels, exercise status, and profile history.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" onclick="showToast('Exporting CSV...')">Export CSV</button>
          <button class="btn btn-primary" onclick="openModal('Invite New Member', getInviteUserModal())">+ Add User</button>
        </div>
      </div>

      <div class="table-container">
        <div class="table-toolbar">
          <div class="search-input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Search user ID, name, email..." oninput="showToast('Filtering users list...')" />
          </div>
          <div style="display:flex; gap:8px;">
            <span class="badge badge-subtle">Filter: All Statuses</span>
            <span class="badge badge-subtle">Filter: All Cycles</span>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Current Cycle</th>
              <th>Journals</th>
              <th>Risk Level</th>
              <th>Exercises</th>
              <th>Subscription</th>
              <th>Last Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr onclick="openDrawer('User Profile — #1042 (Siddhesh)', getUserDrawerContent())">
              <td>
                <div style="display:flex; align-items:center; gap:10px;">
                  <div class="avatar-sm">SK</div>
                  <div>
                    <div style="font-weight:600; color:var(--text-main);">Siddhesh K.</div>
                    <div style="font-size:10px; color:var(--text-muted);">user_1042@ingress.io</div>
                  </div>
                </div>
              </td>
              <td>Cycle 1 (Day 24)</td>
              <td>28 entries</td>
              <td><span class="badge badge-emerald">Low Risk</span></td>
              <td><span class="badge badge-mint">Ex 0, 1, 2, 3</span></td>
              <td><span class="badge badge-mint">Pro Monthly</span></td>
              <td>12 mins ago</td>
              <td>
                <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); openDrawer('User Profile — #1042', getUserDrawerContent());">View Drawer</button>
              </td>
            </tr>
            <tr onclick="openDrawer('User Profile — #1088 (Elena R.)', getUserDrawerContent('Elena R.', 'elena@domain.org', 'High Risk'))">
              <td>
                <div style="display:flex; align-items:center; gap:10px;">
                  <div class="avatar-sm" style="background:var(--terra); color:#fff;">ER</div>
                  <div>
                    <div style="font-weight:600; color:var(--text-main);">Elena Rostova</div>
                    <div style="font-size:10px; color:var(--text-muted);">elena@domain.org</div>
                  </div>
                </div>
              </td>
              <td>Cycle 1 (Day 18)</td>
              <td>19 entries</td>
              <td><span class="badge badge-rose">High Risk</span></td>
              <td><span class="badge badge-mint">Ex 0, 1, 2</span></td>
              <td><span class="badge badge-amber">Trial</span></td>
              <td>1 hour ago</td>
              <td>
                <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); openDrawer('User Profile — #1088', getUserDrawerContent('Elena R.', 'elena@domain.org', 'High Risk'));">View Drawer</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  function getUserDrawerContent(name = 'Siddhesh K.', email = 'user_1042@ingress.io', risk = 'Low Risk') {
    return `
      <div style="space-y:18px;">
        <div style="display:flex; align-items:center; gap:14px; padding-bottom:16px; border-bottom:1px solid var(--border-color);">
          <div class="avatar-circle" style="width:44px; height:44px; font-size:16px;">SK</div>
          <div>
            <h3 style="font-size:16px; font-weight:600; color:var(--text-main);">${name}</h3>
            <p style="font-size:11px; color:var(--text-muted);">${email}</p>
            <span class="badge ${risk === 'High Risk' ? 'badge-rose' : 'badge-emerald'}" style="margin-top:4px;">${risk}</span>
          </div>
        </div>

        <div>
          <h4 style="font-size:10px; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:8px;">Member Overview</h4>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
            <div class="card" style="padding:10px;">
              <div style="font-size:9px; color:var(--text-muted);">JOURNAL ENTRIES</div>
              <div style="font-size:18px; font-weight:600; color:var(--text-main);">28</div>
            </div>
            <div class="card" style="padding:10px;">
              <div style="font-size:9px; color:var(--text-muted);">EXERCISES COMPLETED</div>
              <div style="font-size:18px; font-weight:600; color:var(--text-main);">4 / 4</div>
            </div>
          </div>
        </div>

        <div>
          <h4 style="font-size:10px; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:8px;">Recent Timeline</h4>
          <div style="border-left:2px solid var(--border-color); padding-left:12px; space-y:10px;">
            <div>
              <p style="font-size:11px; font-weight:600;">Completed Exercise 3 (Self Perception)</p>
              <p style="font-size:10px; color:var(--text-muted);">Gap Score: 2/5 · Moderate Divergence</p>
              <span style="font-size:9px; color:var(--text-faint);">Today 12:40 PM</span>
            </div>
          </div>
        </div>

        <div style="pt-4; border-top:1px solid var(--border-color); display:flex; gap:10px;">
          <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="showToast('Password reset sent')">Reset Password</button>
          <button class="btn btn-danger btn-sm" style="flex:1;" onclick="showToast('User account suspended')">Suspend</button>
        </div>
      </div>
    `;
  }

  function getInviteUserModal() {
    return `
      <form onsubmit="event.preventDefault(); closeModal(); showToast('User invitation dispatched!');">
        <div style="margin-bottom:14px;">
          <label style="display:block; font-size:11px; color:var(--text-muted); margin-bottom:4px;">Full Name</label>
          <input type="text" required placeholder="Jane Doe" style="width:100%; padding:8px 12px; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-main); font-size:12px;" />
        </div>
        <div style="margin-bottom:16px;">
          <label style="display:block; font-size:11px; color:var(--text-muted); margin-bottom:4px;">Email Address</label>
          <input type="email" required placeholder="jane@example.com" style="width:100%; padding:8px 12px; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-main); font-size:12px;" />
        </div>
        <div style="display:flex; justify-content:end; gap:10px;">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Send Invitation</button>
        </div>
      </form>
    `;
  }

  // 3. THERAPISTS VIEW
  function renderTherapistsView() {
    workspace.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Therapist Management Panel</h1>
          <p>Verified clinical partners, client caseload assignments, and report sharing consent status.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" onclick="showToast('Opening therapist onboarding wizard...')">+ Onboard Therapist</button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="card">
          <div class="stat-card-title">Verified Therapists</div>
          <div class="stat-card-value">24</div>
        </div>
        <div class="card">
          <div class="stat-card-title">Pending Verifications</div>
          <div class="stat-card-value">3</div>
          <div class="stat-card-change down">⚠️ Requires license review</div>
        </div>
        <div class="card">
          <div class="stat-card-title">Assigned Clients</div>
          <div class="stat-card-value">184</div>
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Therapist</th>
              <th>Specialization</th>
              <th>Active Clients</th>
              <th>Verification</th>
              <th>Consent Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div style="font-weight:600;">Dr. Sarah Jenkins, PsyD</div>
                <div style="font-size:10px; color:var(--text-muted);">sarah.j@clinical.org</div>
              </td>
              <td>Cognitive Behavioral Therapy (CBT)</td>
              <td>12 clients</td>
              <td><span class="badge badge-emerald">Verified</span></td>
              <td><span class="badge badge-mint">Shared Reports Active</span></td>
              <td><button class="btn btn-secondary btn-sm" onclick="showToast('Viewing therapist roster...')">Manage Clients</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // 4. ADVISORS VIEW
  function renderAdvisorsView() {
    workspace.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Advisor Directory</h1>
          <p>Peer advisors, recommendation histories, and member referrals.</p>
        </div>
      </div>
      <div class="card">
        <p style="font-size:12px; color:var(--text-muted);">Advisor directory loaded with 12 active advisors.</p>
      </div>
    `;
  }

  // 5. SUBSCRIPTIONS VIEW
  function renderSubscriptionsView() {
    workspace.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Subscription Management</h1>
          <p>Pricing tier cohorts, active trials, grace periods, and renewal retention rates.</p>
        </div>
      </div>
      <div class="stats-grid">
        <div class="card"><div class="stat-card-title">Active Subscriptions</div><div class="stat-card-value">1,120</div></div>
        <div class="card"><div class="stat-card-title">Trial Users</div><div class="stat-card-value">300</div></div>
        <div class="card"><div class="stat-card-title">Churn Rate</div><div class="stat-card-value">1.8%</div></div>
      </div>
    `;
  }

  // 6. PAYMENTS VIEW
  function renderPaymentsView() {
    workspace.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Payments & Revenue Graphs</h1>
          <p>Stripe transaction logs, refund workflows, and MRR growth curves.</p>
        </div>
      </div>
      <div class="card">
        <h3 style="font-family:var(--font-serif); font-size:16px; font-weight:400; margin-bottom:12px;">Monthly Revenue Trajectory</h3>
        <svg width="100%" height="160" viewBox="0 0 500 150" fill="none">
          <path d="M0 130 Q 120 90 250 70 T 500 20" stroke="#8DBFB4" stroke-width="3" fill="none"/>
          <path d="M0 130 Q 120 90 250 70 T 500 20 L 500 150 L 0 150 Z" fill="rgba(141,191,180,0.08)"/>
        </svg>
      </div>
    `;
  }

  // 7. INTERVENTIONS VIEW
  function renderInterventionsView() {
    workspace.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Intervention Bank CMS</h1>
          <p>Manage micro-reframing exercises, psychological protocols, and category tags.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" onclick="showToast('Creating new intervention card...')">+ New Intervention</button>
        </div>
      </div>
      <div class="stats-grid">
        <div class="card"><div class="stat-card-title">Grounding Exercises</div><div class="stat-card-value">14 Cards</div></div>
        <div class="card"><div class="stat-card-title">Reframing Cards</div><div class="stat-card-value">22 Cards</div></div>
        <div class="card"><div class="stat-card-title">Somatics</div><div class="stat-card-value">8 Cards</div></div>
      </div>
    `;
  }

  // 8. KNOWLEDGE BASE VIEW
  function renderKnowledgeBaseView() {
    workspace.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Knowledge Base CMS</h1>
          <p>Psychoeducational articles, version history, and publication status.</p>
        </div>
      </div>
      <div class="card">
        <p style="font-size:12px; color:var(--text-muted);">Knowledge Base CMS loaded with 48 published cards.</p>
      </div>
    `;
  }

  // 9. VOCABULARY VIEW
  function renderVocabularyView() {
    workspace.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Vocabulary Intelligence Analytics</h1>
          <p>Word association frequency clusters, emotional registers, and suppression dynamics.</p>
        </div>
      </div>
      <div class="card">
        <p style="font-size:12px; color:var(--text-muted);">Vocabulary intelligence engine actively tracking 12,400 word tokens.</p>
      </div>
    `;
  }

  // 10. PATTERNS VIEW
  function renderPatternsView() {
    workspace.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Pattern Intelligence Analytics</h1>
          <p>Behavioral pattern extraction, recurring theme detection, and risk overview.</p>
        </div>
      </div>
      <div class="card">
        <p style="font-size:12px; color:var(--text-muted);">Pattern engine active with 68 extracted behavior clusters.</p>
      </div>
    `;
  }

  // 11. REPORTS VIEW
  function renderReportsView() {
    workspace.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Reports Regeneration Queue</h1>
          <p>Weekly & Monthly AI report generation status, worker queue, and failure logs.</p>
        </div>
      </div>
      <div class="stats-grid">
        <div class="card"><div class="stat-card-title">Completed Reports</div><div class="stat-card-value">1,840</div></div>
        <div class="card"><div class="stat-card-title">Pending Queue</div><div class="stat-card-value">0</div></div>
        <div class="card"><div class="stat-card-title">Failure Rate</div><div class="stat-card-value">0.00%</div></div>
      </div>
    `;
  }

  // 12. EXERCISES VIEW
  function renderExercisesView() {
    workspace.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Exercise System Library & Analytics</h1>
          <p>Exercise 0–3 completion statistics, unlock progression, and score distributions.</p>
        </div>
      </div>
      <div class="stats-grid">
        <div class="card"><div class="stat-card-title">Ex 0 Baseline OCEAN</div><div class="stat-card-value">1,420 Completed</div></div>
        <div class="card"><div class="stat-card-title">Ex 1 Word Association</div><div class="stat-card-value">1,180 Completed</div></div>
        <div class="card"><div class="stat-card-title">Ex 2 Inkblot Projective</div><div class="stat-card-value">840 Completed</div></div>
        <div class="card"><div class="stat-card-title">Ex 3 Self Perception</div><div class="stat-card-value">342 Completed</div></div>
      </div>
    `;
  }

  // 13. AI USAGE VIEW
  function renderAiUsageView() {
    workspace.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>AI Provider Usage & Cost Dashboard</h1>
          <p>Groq Llama-3.3-70b vs Anthropic Claude request counts, latency, and cost telemetry.</p>
        </div>
      </div>
      <div class="stats-grid">
        <div class="card"><div class="stat-card-title">Groq Requests (Today)</div><div class="stat-card-value">4,280</div></div>
        <div class="card"><div class="stat-card-title">Avg Latency</div><div class="stat-card-value">640ms</div></div>
        <div class="card"><div class="stat-card-title">Est. Monthly Cost</div><div class="stat-card-value">$42.80</div></div>
      </div>
    `;
  }

  // 14. SUPPORT VIEW
  function renderSupportView() {
    workspace.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Support & Member Feedback</h1>
          <p>Member tickets, bug reports, and feature requests.</p>
        </div>
      </div>
      <div class="card"><p style="font-size:12px; color:var(--text-muted);">0 open urgent tickets.</p></div>
    `;
  }

  // 15. NOTIFICATIONS VIEW
  function renderNotificationsView() {
    workspace.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Notifications & Communications</h1>
          <p>Email templates, push broadcasts, and SMS alerts.</p>
        </div>
      </div>
      <div class="card"><p style="font-size:12px; color:var(--text-muted);">Broadcast engine ready.</p></div>
    `;
  }

  // 16. SYSTEM HEALTH VIEW
  function renderSystemHealthView() {
    workspace.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>System Health & Infrastructure</h1>
          <p>Supabase Database, Redis Queue, Worker processes, and Storage telemetry.</p>
        </div>
      </div>
      <div class="stats-grid">
        <div class="card"><div class="stat-card-title">Supabase Database</div><div class="stat-card-value" style="color:var(--emerald);">Operational</div></div>
        <div class="card"><div class="stat-card-title">Redis / BullMQ</div><div class="stat-card-value" style="color:var(--emerald);">Operational</div></div>
        <div class="card"><div class="stat-card-title">Groq API</div><div class="stat-card-value" style="color:var(--emerald);">Operational</div></div>
      </div>
    `;
  }

  // 17. AUDIT LOGS VIEW
  function renderAuditLogsView() {
    workspace.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>System Audit Logs</h1>
          <p>Filterable timeline of all critical administrative and system events.</p>
        </div>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr><th>Timestamp</th><th>Actor</th><th>Action</th><th>Target</th><th>IP Address</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>2026-07-28 00:20:14</td>
              <td>Admin (Founder)</td>
              <td>Unlocked Exercise 3 for All Users</td>
              <td>Global Scope</td>
              <td>192.168.1.1</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // 18. SETTINGS VIEW
  function renderSettingsView() {
    workspace.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Platform Settings & Security</h1>
          <p>API keys, role permissions, branding, and environment variables.</p>
        </div>
      </div>
      <div class="card">
        <h3 style="font-family:var(--font-serif); font-size:16px; font-weight:400; margin-bottom:12px;">Environment Variables</h3>
        <p style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono);">GROQ_API_KEY: set (enc-****)</p>
      </div>
    `;
  }

  // Initial Boot
  renderView('dashboard');
});
