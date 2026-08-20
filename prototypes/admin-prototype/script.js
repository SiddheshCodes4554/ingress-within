/* ============================================================
   INGRESS WITHIN · ADMIN DASHBOARD
   Papery Theme — JavaScript Interactivity
   ============================================================ */

// ============================================================
// NAVIGATION
// ============================================================
document.querySelectorAll('.sidebar__link').forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    const pageId = this.dataset.page;
    if (pageId) navigateTo(pageId);
  });
});

function navigateTo(pageId) {
  // Update sidebar links
  document.querySelectorAll('.sidebar__link').forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`.sidebar__link[data-page="${pageId}"]`);
  if (activeLink) activeLink.classList.add('active');

  // Show page
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const targetPage = document.getElementById(`page-${pageId}`);
  if (targetPage) {
    targetPage.classList.add('active');
  }

  // Update breadcrumb
  const breadcrumb = document.getElementById('breadcrumb');
  if (activeLink) {
    const pageName = activeLink.querySelector('span')?.textContent || pageId;
    const nameMap = {
      'ai-usage': 'AI Usage',
      'notifications-page': 'Notifications',
      'system-health': 'System Health',
      'audit-logs': 'Audit Logs',
      'content-manager': 'Content'
    };
    const displayName = nameMap[pageId] || pageName;
    breadcrumb.innerHTML = `<span class="topbar__crumb current">${displayName}</span>`;
  }

  // Close mobile sidebar
  closeMobileSidebar();

  // Close context panel on mobile
  const contextPanel = document.getElementById('contextPanel');
  if (window.innerWidth <= 1400 && contextPanel) {
    contextPanel.style.display = 'none';
  }

  // Scroll to top of page container
  document.querySelector('.page-container')?.scrollTo(0, 0);

  // Animate counters on the target page
  setTimeout(() => animateCounters(targetPage), 100);
}

// ============================================================
// THEME TOGGLE
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('ingress-theme') || 'paper';
  document.documentElement.setAttribute('data-theme', savedTheme);
});

document.getElementById('themeToggle')?.addEventListener('click', () => {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'paper' ? 'paper-dark' : 'paper';
  html.setAttribute('data-theme', next);
  localStorage.setItem('ingress-theme', next);
  showToast(`Switched to ${next === 'paper-dark' ? 'dark' : 'light'} mode`);
});

// ============================================================
// MOBILE SIDEBAR
// ============================================================
document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
  document.getElementById('sidebar')?.classList.toggle('mobile-open');
  // Create overlay if not exists
  let overlay = document.querySelector('.mobile-menu-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'mobile-menu-overlay';
    overlay.addEventListener('click', closeMobileSidebar);
    document.body.appendChild(overlay);
  }
  overlay.classList.toggle('open');
});

function closeMobileSidebar() {
  document.getElementById('sidebar')?.classList.remove('mobile-open');
  document.querySelector('.mobile-menu-overlay')?.classList.remove('open');
}

// ============================================================
// PROFILE DROPDOWN
// ============================================================
document.getElementById('profileDropdown')?.addEventListener('click', function (e) {
  e.stopPropagation();
  const menu = document.getElementById('profileDropdownMenu');
  menu.classList.toggle('open');
});

document.addEventListener('click', () => {
  closeAllDropdowns();
});

function closeAllDropdowns() {
  document.querySelectorAll('.topbar__dropdown').forEach(d => d.classList.remove('open'));
}

// ============================================================
// ANIMATED COUNTERS
// ============================================================
function animateCounters(container) {
  if (!container) container = document;
  const counters = container.querySelectorAll('[data-counter]');
  counters.forEach(counter => {
    const target = counter.dataset.counter;
    const isFormatted = typeof target === 'string' && (target.includes('.') || target.includes('k') || target.includes('M'));
    const rawValue = parseFloat(target) || parseInt(target) || 0;
    const duration = 1500;
    const startTime = performance.now();

    // Reset
    if (!isFormatted) {
      counter.textContent = '0';
    } else {
      counter.textContent = '0';
    }

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = rawValue * easeOut;

      if (isFormatted) {
        if (target.includes('M')) {
          counter.textContent = (currentValue / 1000000).toFixed(1) + 'M';
        } else if (target.includes('k')) {
          counter.textContent = (currentValue / 1000).toFixed(1) + 'k';
        }
      } else if (Number.isInteger(rawValue)) {
        counter.textContent = Math.floor(currentValue).toLocaleString();
      } else {
        counter.textContent = currentValue.toFixed(1);
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        // Final value
        if (isFormatted) {
          counter.textContent = target;
        } else if (Number.isInteger(rawValue)) {
          counter.textContent = Math.round(rawValue).toLocaleString();
        } else {
          counter.textContent = rawValue.toFixed(1);
        }
      }
    }

    requestAnimationFrame(update);
  });
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';

  let icon = '';
  switch (type) {
    case 'success':
      icon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>';
      break;
    case 'error':
      icon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
      break;
    default:
      icon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-info)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
  }

  toast.innerHTML = `${icon}<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast--out');
    setTimeout(() => toast.remove(), 250);
  }, 2500);
}

// ============================================================
// MODAL
// ============================================================
function openModal(name) {
  const backdrop = document.getElementById('modal-backdrop');
  const modal = document.getElementById('global-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');

  let modalContent = '';

  switch (name) {
    case 'user-invite':
      title.textContent = 'Invite User';
      modalContent = `
        <div style="display:flex;flex-direction:column;gap:1rem">
          <div class="settings-field"><label>Email</label><input type="email" class="input" placeholder="user@example.com" style="width:100%" /></div>
          <div class="settings-field"><label>Role</label><select class="input" style="width:100%"><option>User</option><option>Therapist</option><option>Advisor</option><option>Admin</option></select></div>
          <div class="settings-field"><label>Send welcome email</label><label class="toggle"><input type="checkbox" checked /><span class="toggle__slider"></span></label></div>
        </div>
      `;
      document.getElementById('modal-foot').innerHTML = '<button class="btn btn--ghost" onclick="closeModal()">Cancel</button><button class="btn btn--primary" onclick="closeModal();showToast(\'Invitation sent\')">Send Invite</button>';
      break;

    case 'pricing':
      title.textContent = 'Manage Pricing Plans';
      modalContent = `
        <div style="display:flex;flex-direction:column;gap:1rem">
          <p class="text-muted">TODO: Founder Decision — Define final pricing tiers, discounts, and annual billing options.</p>
          <span class="badge badge--warning" style="width:fit-content">Founder Decision Needed</span>
        </div>
      `;
      document.getElementById('modal-foot').innerHTML = '<button class="btn btn--ghost" onclick="closeModal()">Cancel</button><button class="btn btn--primary" onclick="closeModal();showToast(\'Pricing updated\')">Save Plans</button>';
      break;

    case 'intervention':
      title.textContent = 'New Intervention';
      modalContent = `
        <div style="display:flex;flex-direction:column;gap:1rem">
          <div class="settings-field"><label>Title</label><input type="text" class="input" placeholder="Intervention name" style="width:100%" /></div>
          <div class="settings-field"><label>Category</label><select class="input" style="width:100%"><option>Grounding</option><option>Breathing</option><option>CBT</option><option>Mindfulness</option><option>Journaling</option></select></div>
          <div class="settings-field"><label>Difficulty</label><select class="input" style="width:100%"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div>
          <div class="settings-field" style="align-items:flex-start"><label>Description</label><textarea class="input" placeholder="Describe the intervention…" style="width:100%;min-height:80px;resize:vertical"></textarea></div>
        </div>
      `;
      document.getElementById('modal-foot').innerHTML = '<button class="btn btn--ghost" onclick="closeModal()">Cancel</button><button class="btn btn--primary" onclick="closeModal();showToast(\'Intervention created\')">Create</button>';
      break;

    case 'intervention-preview':
      title.textContent = 'Preview: 5-4-3-2-1 Technique';
      modalContent = `
        <div style="display:flex;flex-direction:column;gap:1rem">
          <div style="background:var(--color-bg-surface);padding:1.25rem;border-radius:var(--radius-md);text-align:center">
            <p style="font-family:var(--font-serif);font-size:1.25rem;margin-bottom:1rem">5-4-3-2-1 Grounding Technique</p>
            <p class="text-muted" style="font-size:0.85rem;line-height:1.7">Acknowledge <strong>5</strong> things you see around you.<br/>
            Acknowledge <strong>4</strong> things you can touch.<br/>
            Acknowledge <strong>3</strong> things you can hear.<br/>
            Acknowledge <strong>2</strong> things you can smell.<br/>
            Acknowledge <strong>1</strong> thing you can taste.</p>
          </div>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap"><span class="badge badge--primary">Grounding</span><span class="badge badge--secondary">5 min</span><span class="badge badge--secondary">Beginner</span></div>
        </div>
      `;
      document.getElementById('modal-foot').innerHTML = '<button class="btn btn--primary" onclick="closeModal()">Close</button>';
      break;

    default:
      title.textContent = 'Dialog';
      modalContent = '<p class="text-muted">Modal content placeholder.</p>';
      document.getElementById('modal-foot').innerHTML = '<button class="btn btn--ghost" onclick="closeModal()">Cancel</button><button class="btn btn--primary" onclick="closeModal()">Confirm</button>';
  }

  body.innerHTML = modalContent;
  backdrop.classList.add('open');
  modal.classList.add('open');
}

function closeModal() {
  document.getElementById('modal-backdrop')?.classList.remove('open');
  document.getElementById('global-modal')?.classList.remove('open');
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    closeDrawer();
    closeAllDropdowns();
  }
});

// ============================================================
// DRAWER
// ============================================================
function openUserDrawer(userName) {
  const drawer = document.getElementById('drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  const title = document.getElementById('drawer-title');
  const body = document.getElementById('drawer-body');

  title.textContent = userName;

  const userData = {
    'Siddhesh': {
      initials: 'S',
      status: 'Active',
      risk: 'Low',
      journals: 36,
      plan: 'Ingress Inner Circle',
      email: 'siddhesh@ingresswithin.app',
      joined: 'Jun 2026',
      cycles: 2,
      devices: 'MacBook Pro, iPhone 15',
      lastLogin: '2 min ago',
      timeline: [
        { dot: 'green', text: 'Completed Day 6 entry: "Today felt steady..."', time: '2 min ago' },
        { dot: 'purple', text: 'Exercise 0 (OCEAN Baseline): Baseline Summary generated', time: '1h ago' },
        { dot: 'blue', text: 'Vocabulary Engine: 106 distinct words compiled for Cycle 2', time: '3h ago' },
        { dot: 'amber', text: 'Pattern Engine: Detected "Emotional Exhaustion" trajectory', time: '1d ago' }
      ]
    },
    'Sakshi Bhuwania': {
      initials: 'SB',
      status: 'Active',
      risk: 'Low',
      journals: 9,
      plan: 'Ingress Inner Circle',
      email: 'sakshi@ingresswithin.app',
      joined: 'Jul 2026',
      cycles: 2,
      devices: 'iPhone 14, iPad',
      lastLogin: '15 min ago',
      timeline: [
        { dot: 'green', text: 'Completed Day 14 entry & reflection thread', time: '15 min ago' },
        { dot: 'blue', text: '4 System V4 exercises unlocked for Cycle 2', time: '2h ago' },
        { dot: 'amber', text: 'Week 2 report generated by AI worker', time: '5h ago' }
      ]
    },
    'Siddhu': {
      initials: 'S',
      status: 'Active',
      risk: 'Low',
      journals: 1,
      plan: 'Trial',
      email: 'siddhu@ingresswithin.app',
      joined: 'Jul 2026',
      cycles: 1,
      devices: 'Pixel 8',
      lastLogin: '1h ago',
      timeline: [
        { dot: 'green', text: 'Completed Cycle 1 onboarding & baseline setup', time: '1h ago' },
        { dot: 'purple', text: 'Exercise 0 (OCEAN Baseline) available', time: '1h ago' }
      ]
    },
    'Aarav Sharma': {
      initials: 'AS',
      status: 'Active',
      risk: 'Low',
      journals: 28,
      plan: 'Ingress Inner Circle',
      email: 'aarav.s@example.com',
      joined: 'May 2026',
      cycles: 3,
      devices: 'iPhone 15 Pro',
      lastLogin: '45 min ago',
      timeline: [
        { dot: 'green', text: 'Submitted Word Association Test (12 words)', time: '45 min ago' },
        { dot: 'purple', text: 'Pattern Engine: "Focus on Control" quiet', time: '1d ago' }
      ]
    },
    'Ananya Iyer': {
      initials: 'AI',
      status: 'Active',
      risk: 'Medium',
      journals: 19,
      plan: 'Clinical Tier',
      email: 'ananya.i@example.com',
      joined: 'Jun 2026',
      cycles: 2,
      devices: 'Samsung S24, Galaxy Tab',
      lastLogin: '2h ago',
      timeline: [
        { dot: 'amber', text: 'Self-Perception Check completed (Gap score: 3.2/5)', time: '2h ago' },
        { dot: 'purple', text: 'Therapist review flag generated for clinical review', time: '4h ago' }
      ]
    },
    'Rohan Mehta': {
      initials: 'RM',
      status: 'At Risk',
      risk: 'High',
      journals: 14,
      plan: 'Clinical Tier',
      email: 'rohan.m@example.com',
      joined: 'Apr 2026',
      cycles: 2,
      devices: 'Windows PC, Android',
      lastLogin: '3h ago',
      timeline: [
        { dot: 'red', text: 'Safety signal: Crisis triage check initiated', time: '3h ago' },
        { dot: 'amber', text: 'Assigned to Dr. Ananya Sen (Clinical Advisor)', time: '5h ago' }
      ]
    },
    'Priya Patel': {
      initials: 'PP',
      status: 'Active',
      risk: 'Low',
      journals: 42,
      plan: 'Ingress Inner Circle',
      email: 'priya.p@example.com',
      joined: 'Mar 2026',
      cycles: 4,
      devices: 'MacBook Air, iPhone 14',
      lastLogin: '30 min ago',
      timeline: [
        { dot: 'green', text: 'Inkblot Projective Test completed (Card 5 washes)', time: '30 min ago' },
        { dot: 'blue', text: 'Defense Lens identified: Intellectualization', time: '1h ago' }
      ]
    }
  };

  const data = userData[userName] || {
    initials: userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
    status: 'Active',
    risk: 'Low',
    journals: 12,
    plan: 'Ingress Inner Circle',
    email: `${userName.toLowerCase().replace(/\s+/g, '.')}@ingresswithin.app`,
    joined: 'May 2026',
    cycles: 1,
    devices: 'Web App',
    lastLogin: '10 min ago',
    timeline: [
      { dot: 'green', text: 'Completed journal entry', time: '10 min ago' },
      { dot: 'blue', text: 'Exercise completed', time: '2h ago' }
    ]
  };

  const timelineHtml = (data.timeline || []).map(t => `
    <div class="timeline__item">
      <div class="timeline__dot timeline__dot--${t.dot}"></div>
      <div class="timeline__content"><p class="timeline__text">${t.text}</p><span class="timeline__time">${t.time}</span></div>
    </div>
  `).join('');

  body.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:1.25rem">
      <!-- Profile header -->
      <div style="display:flex;align-items:center;gap:1rem">
        <div class="user-avatar" style="width:48px;height:48px;font-size:1rem">${data.initials}</div>
        <div>
          <h3 style="font-family:var(--font-serif);font-size:1.1rem;font-weight:400">${userName}</h3>
          <p class="text-muted" style="font-size:0.8rem">${data.email}</p>
        </div>
      </div>

      <!-- Stats row -->
      <div class="stat-row">
        <div class="stat-row__item"><span class="stat-row__value">${data.journals}</span><span class="stat-row__label">Journals</span></div>
        <div class="stat-row__item"><span class="stat-row__value">${data.cycles}</span><span class="stat-row__label">Cycles</span></div>
        <div class="stat-row__item"><span class="stat-row__value" style="font-size:0.9rem">${data.plan}</span><span class="stat-row__label">Plan</span></div>
      </div>

      <!-- Info rows -->
      <div style="display:flex;flex-direction:column;gap:0.5rem">
        <div style="display:flex;justify-content:space-between;font-size:0.85rem"><span class="text-muted">Status</span><span class="status status--${data.status === 'Active' ? 'active' : 'warning'}">${data.status}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:0.85rem"><span class="text-muted">Risk Level</span><span class="risk risk--${data.risk.toLowerCase()}">${data.risk}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:0.85rem"><span class="text-muted">Member Since</span><span>${data.joined}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:0.85rem"><span class="text-muted">Devices</span><span>${data.devices}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:0.85rem"><span class="text-muted">Last Login</span><span>${data.lastLogin}</span></div>
      </div>

      <!-- Timeline -->
      <div>
        <h4 style="font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-text-muted);margin-bottom:0.75rem">Recent Activity</h4>
        <div class="activity-timeline">
          ${timelineHtml}
        </div>
      </div>

      <!-- Actions -->
      <div style="display:flex;gap:0.5rem;padding-top:0.75rem;border-top:1px solid var(--color-border)">
        <button class="btn btn--ghost btn--sm" onclick="closeDrawer();showToast('User suspended')">Suspend</button>
        <button class="btn btn--ghost btn--sm" onclick="closeDrawer();showToast('Password reset sent')">Reset Password</button>
        <button class="btn btn--danger btn--sm" style="background:var(--color-danger);color:#fff;border-color:var(--color-danger)" onclick="closeDrawer();showToast('User deleted')">Delete</button>
      </div>
    </div>
  `;

  backdrop.classList.add('open');
  drawer.classList.add('open');
}

function closeDrawer() {
  document.getElementById('drawer-backdrop')?.classList.remove('open');
  document.getElementById('drawer')?.classList.remove('open');
}

// ============================================================
// CHART TAB SWITCHING
// ============================================================
function switchChart(btn, period) {
  const parent = btn.closest('.card__head');
  parent.querySelectorAll('.card__tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');

  // Animate chart bars based on period
  const chart = btn.closest('.card').querySelector('.chart__bars');
  if (chart) {
    const bars = chart.querySelectorAll('.chart__bar');
    const weekHeights = [40, 65, 55, 80, 70, 45, 30];
    const monthHeights = [55, 60, 45, 70, 65, 50, 40, 75, 68, 55, 72, 48, 58, 62];

    bars.forEach((bar, i) => {
      const heights = period === 'week' ? weekHeights : monthHeights.slice(0, bars.length);
      const h = heights[i] || 50;
      bar.style.height = `${h}%`;
    });
  }

  showToast(`Showing ${period === 'week' ? 'weekly' : 'monthly'} data`);
}

// ============================================================
// REPORT TAB SWITCHING
// ============================================================
function switchReportTab(btn, tab) {
  const parent = btn.closest('.tabs');
  parent.querySelectorAll('.tab').forEach(t => t.classList.remove('tab--active'));
  btn.classList.add('tab--active');

  const container = btn.closest('.page');
  container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const target = container.querySelector(`#report-${tab}`);
  if (target) target.classList.add('active');
}

// ============================================================
// SUPPORT TAB SWITCHING
// ============================================================
function switchSupportTab(btn, tab) {
  const parent = btn.closest('.tabs');
  parent.querySelectorAll('.tab').forEach(t => t.classList.remove('tab--active'));
  btn.classList.add('tab--active');

  const container = btn.closest('.page');
  container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const target = container.querySelector(`#support-${tab}`);
  if (target) target.classList.add('active');
}

// ============================================================
// NOTIFICATION TAB SWITCHING
// ============================================================
function switchNotifTab(btn, tab) {
  const parent = btn.closest('.tabs');
  parent.querySelectorAll('.tab').forEach(t => t.classList.remove('tab--active'));
  btn.classList.add('tab--active');

  const container = btn.closest('.page');
  container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const target = container.querySelector(`#notif-${tab}`);
  if (target) target.classList.add('active');
}

// ============================================================
// TABLE FILTERING
// ============================================================
function filterTable(inputId, tableId) {
  const input = document.getElementById(inputId);
  const table = document.getElementById(tableId);
  if (!input || !table) return;

  const query = input.value.toLowerCase();
  const rows = table.querySelectorAll('tbody tr');

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query) ? '' : 'none';
  });
}

// ============================================================
// GLOBAL SEARCH
// ============================================================
document.getElementById('globalSearch')?.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    const query = this.value.trim();
    if (query) {
      showToast(`Searching for "${query}"...`);
      // Simple search: try to find matching pages
      const pages = {
        'user': 'users',
        'users': 'users',
        'dashboard': 'dashboard',
        'therapist': 'therapists',
        'advisor': 'advisors',
        'subscription': 'subscriptions',
        'payment': 'payments',
        'intervention': 'interventions',
        'knowledge': 'knowledge',
        'vocabulary': 'vocabulary',
        'pattern': 'patterns',
        'report': 'reports',
        'exercise': 'exercises',
        'ai': 'ai-usage',
        'analytics': 'analytics',
        'support': 'support',
        'notification': 'notifications-page',
        'setting': 'settings',
        'audit': 'audit-logs',
        'health': 'system-health',
        'content': 'content-manager'
      };

      const lower = query.toLowerCase();
      for (const [key, pageId] of Object.entries(pages)) {
        if (lower.includes(key) || key.includes(lower)) {
          navigateTo(pageId);
          this.value = '';
          return;
        }
      }
    }
  }
});

// Keyboard shortcut: Ctrl/Cmd+K to focus search
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('globalSearch')?.focus();
  }
});

// ============================================================
// CREATE BUTTON
// ============================================================
document.getElementById('createBtn')?.addEventListener('click', () => {
  // Show a quick action menu (in a real app this would be a dropdown)
  showToast('Create: New user, intervention, or report');
});

// ============================================================
// NOTIFICATION BUTTON
// ============================================================
document.getElementById('notifBtn')?.addEventListener('click', () => {
  showToast('3 unread notifications');
  // Navigate to notifications page
  navigateTo('notifications-page');
});

// ============================================================
// SIDEBAR COLLAPSE
// ============================================================
document.getElementById('sidebarCollapse')?.addEventListener('click', () => {
  const sidebar = document.getElementById('sidebar');
  const isCollapsed = sidebar.dataset.collapsed === 'true';
  sidebar.dataset.collapsed = isCollapsed ? 'false' : 'true';

  if (!isCollapsed) {
    sidebar.style.width = 'var(--sidebar-collapsed)';
    // Hide text elements
    sidebar.querySelectorAll('.sidebar__brand-name, .sidebar__section-title, .sidebar__link span:not(svg), .sidebar__theme-label, .badge').forEach(el => {
      el.style.display = 'none';
    });
  } else {
    sidebar.style.width = 'var(--sidebar-width)';
    sidebar.querySelectorAll('.sidebar__brand-name, .sidebar__section-title, .sidebar__link span, .sidebar__theme-label, .badge').forEach(el => {
      el.style.display = '';
    });
  }
});

// ============================================================
// CONTEXT PANEL TOGGLE
// ============================================================
document.getElementById('contextPanelClose')?.addEventListener('click', () => {
  const panel = document.getElementById('contextPanel');
  panel.style.display = 'none';
});

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Animate counters on dashboard (default page)
  setTimeout(() => animateCounters(document.getElementById('page-dashboard')), 300);

  // Add keyboard shortcut hint
  console.log('Ingress Within Dashboard loaded. Press ⌘K to search.');
});

// ============================================================
// HEALTH REFRESH BUTTON WITH SPINNER
// ============================================================
document.getElementById('healthRefreshBtn')?.addEventListener('click', function () {
  const svg = this.querySelector('svg');
  svg.style.transition = 'transform 0.6s';
  svg.style.transform = 'rotate(360deg)';

  showToast('Refreshing system health...');

  setTimeout(() => {
    svg.style.transition = 'none';
    svg.style.transform = 'rotate(0deg)';
  }, 700);
});

// ============================================================
// CHIP FILTER CLICK HANDLER
// ============================================================
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', function () {
    const parent = this.closest('.filter-chips');
    if (parent) {
      parent.querySelectorAll('.chip').forEach(c => c.classList.remove('chip--active'));
      this.classList.add('chip--active');
      showToast(`Filtered by: ${this.textContent}`);
    }
  });
});

// ============================================================
// PAGINATION CLICK HANDLER
// ============================================================
document.querySelectorAll('.pagination__controls .btn').forEach(btn => {
  btn.addEventListener('click', function () {
    if (this.disabled) return;
    const text = this.textContent.trim();
    if (text === 'Previous' || text === 'Next') {
      showToast(`Navigating ${text.toLowerCase()} page`);
    } else if (text !== '…') {
      const parent = this.closest('.pagination__controls');
      parent.querySelectorAll('.btn--primary').forEach(b => b.className = b.className.replace('btn--primary', 'btn--ghost'));
      this.className = 'btn btn--primary btn--sm';
    }
  });
});

// ============================================================
// CHART BAR HOVER INTERACTION
// ============================================================
document.querySelectorAll('.chart__bar').forEach(bar => {
  bar.addEventListener('mouseenter', function () {
    const oldOpacity = this.style.opacity;
    this.style.opacity = '1';
  });
  bar.addEventListener('mouseleave', function () {
    this.style.opacity = '';
  });
});
