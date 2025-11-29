document.addEventListener('DOMContentLoaded', function() {
    // Check if staff is logged in
    const isStaffLoggedIn = localStorage.getItem('isStaffLoggedIn');
    const currentStaff = localStorage.getItem('currentStaff');
    
    if (isStaffLoggedIn !== 'true' || !currentStaff) {
        // Redirect to login if not authenticated
        window.location.href = '../admin_staff.html';
        return;
    }
    
    const staff = JSON.parse(currentStaff);
    
    // Update navigation based on role
    document.getElementById('staffUserName').innerHTML = `${staff.name} <ion-icon name="chevron-down-outline"></ion-icon>`;
    document.getElementById('dashboardWelcome').textContent = `Welcome back, ${staff.name}!`;
    
    // Show/hide navigation items based on role
    if (staff.role === 'staff') {
        // Staff can view orders and menu items
        document.getElementById('ordersNavLink').style.display = 'block';
        document.getElementById('viewMenuNavLink').style.display = 'block';
    } else if (staff.role === 'admin') {
        // Admin can view everything except View Menu (they have Menu Management)
        document.getElementById('ordersNavLink').style.display = 'block';
        document.getElementById('menuManagementNavLink').style.display = 'block';
        document.getElementById('userManagementNavLink').style.display = 'block';
        // Show Analytics link for administrators
        const analyticsNav = document.getElementById('analyticsNavLink');
        if (analyticsNav) analyticsNav.style.display = 'block';
    }
    
    // Initialize dashboard
    // Normalize any legacy orders so payment fields display correctly in admin/staff views
    normalizeOrdersForDashboard();
    loadDashboardStats();
    loadRecentOrders();
    // If admin, load analytics widgets as well
    try {
        if (staff.role === 'admin') loadAnalytics();
    } catch (e) { /* ignore if analytics not present */ }
    
    // Setup dropdown click handler
    setupDropdownHandler();
    
    // Setup mobile menu toggle for dashboard
    setupMobileMenuToggle();

    // Listen for order changes from other tabs/windows and refresh dashboard data
    window.addEventListener('storage', function(e) {
        if (!e.key) return;
        if (e.key === 'orders' || e.key === 'orders_updated') {
            // Refresh visible dashboard sections so admin/staff see changes immediately
            try {
                loadDashboardStats();
                loadRecentOrders();
                try { loadAnalytics(); } catch (e) { /* ignore */ }
                const ordersContent = document.getElementById('ordersContent');
                if (ordersContent && ordersContent.style.display === 'block') {
                    loadAllOrders();
                }
            } catch (err) {
                console.warn('Error refreshing dashboard after storage event', err);
            }
        }
    });
});

function setupMobileMenuToggle() {
    const menuToggle = document.getElementById('menuToggle');
    const dashboardNav = document.getElementById('dashboardNav');
    
    if (menuToggle && dashboardNav) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            dashboardNav.classList.toggle('active');
            
            // Toggle icon between menu and close
            const icon = menuToggle.querySelector('ion-icon');
            if (dashboardNav.classList.contains('active')) {
                icon.setAttribute('name', 'close-outline');
            } else {
                icon.setAttribute('name', 'menu-outline');
            }
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (dashboardNav.classList.contains('active')) {
                const isClickInsideNav = dashboardNav.contains(event.target);
                const isClickOnToggle = menuToggle.contains(event.target);
                
                if (!isClickInsideNav && !isClickOnToggle) {
                    dashboardNav.classList.remove('active');
                    const icon = menuToggle.querySelector('ion-icon');
                    if (icon) icon.setAttribute('name', 'menu-outline');
                }
            }
        });
        
        // Close mobile menu when clicking on a link
        const navLinksItems = dashboardNav.querySelectorAll('a:not(.dropdown-toggle)');
        navLinksItems.forEach(link => {
            link.addEventListener('click', (e) => {
                // Don't close navbar if clicking inside dropdown menus
                if (link.closest('.dropdown-menu') || link.closest('.dropdown')) {
                    return;
                }
                
                if (window.innerWidth <= 768) {
                    dashboardNav.classList.remove('active');
                    const icon = menuToggle.querySelector('ion-icon');
                    if (icon) icon.setAttribute('name', 'menu-outline');
                }
            });
        });
    }
}

function setupDropdownHandler() {
    const dropdown = document.querySelector('.account-dropdown');
    const toggle = dropdown.querySelector('.dropdown-toggle');
    
    toggle.addEventListener('click', function(e) {
        e.preventDefault();
        dropdown.classList.toggle('open');
    });
    
    document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('open');
        }
    });
}

// Format numbers as PHP currency with thousand separators and two decimals
function formatCurrency(n) {
    const num = parseFloat(String(n).replace(/[^0-9.-]+/g, '')) || 0;
    return num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ============================================
// NAVIGATION FUNCTIONS
// ============================================

function showDashboard() {
    hideAllContent();
    // Show the main dashboard content and refresh dynamic data so returning
    // to this view reflects the latest orders, stats and recent activity
    const dashboardContent = document.getElementById('dashboardContent');
    if (dashboardContent) dashboardContent.style.display = 'block';

    const currentStaff = JSON.parse(localStorage.getItem('currentStaff')) || {};
    const isAdmin = currentStaff.role === 'admin' || false;

    // Reload stats and lists so the dashboard shows up-to-date information
    loadDashboardStats();
    loadRecentOrders();
}

function showOrders() {
    hideAllContent();
    document.getElementById('ordersContent').style.display = 'block';
    loadAllOrders();
}

function showViewMenu() {
    hideAllContent();
    document.getElementById('viewMenuContent').style.display = 'block';
    loadViewMenuItems();
}

function showMenuManagement() {
    const currentStaff = JSON.parse(localStorage.getItem('currentStaff'));
    if (currentStaff.role !== 'admin') {
        showAlert('error', 'Access denied! Only administrators can manage menu items.');
        return;
    }
    hideAllContent();
    document.getElementById('menuManagementContent').style.display = 'block';
    loadMenuItems();
}

function showUserManagement() {
    const currentStaff = JSON.parse(localStorage.getItem('currentStaff'));
    if (currentStaff.role !== 'admin') {
        showAlert('error', 'Access denied! Only administrators can manage users.');
        return;
    }
    hideAllContent();
    document.getElementById('userManagementContent').style.display = 'block';
    showUserTab('customers');
}

// Show Analytics (Admin only) and kick off loading of analytics widgets
function showAnalytics() {
    const currentStaff = JSON.parse(localStorage.getItem('currentStaff')) || { role: 'staff' };
    if (currentStaff.role !== 'admin') {
        showAlert('error', 'Access denied! Only administrators can view analytics.');
        return;
    }
    hideAllContent();
    const content = document.getElementById('analyticsContent');
    if (!content) return;
    content.style.display = 'block';
    loadAnalytics();
}

// Load analytics data and render simple KPI cards and charts into #analyticsArea
function loadAnalytics() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];

    // Exclude cancelled orders from analytics calculations so cancelled orders do not affect KPIs
    const analyticsOrders = orders.filter(o => !(o.status === 'Cancelled' || o.status === 'cancelled'));

    const totalOrders = analyticsOrders.length;
    const totalRevenue = analyticsOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const avgOrderValue = totalOrders ? (totalRevenue / totalOrders) : 0;

    // Product counts
    const productCounts = {};
    analyticsOrders.forEach(o => {
        (o.items || []).forEach(it => {
            const menuMatchForName = menuItems.find(m => ((m.id !== undefined && m.id === it.id) || ((m.name || '').toLowerCase() === (it.name || '').toLowerCase()))) || {};
            const key = (it.name && String(it.name)) || menuMatchForName.name || (`item_${it.id || 'unknown'}`);
            const qty = Number(it.quantity) || 1;
            productCounts[key] = (productCounts[key] || 0) + qty;
        });
    });

    const productArray = Object.keys(productCounts).map(name => ({ name, count: productCounts[name] }));
    const bestSelling = productArray.slice().sort((a, b) => b.count - a.count).slice(0, 5);
    const leastSelling = productArray.slice().sort((a, b) => a.count - b.count).slice(0, 5);

    // Sales by location (municipality)
    const salesByLocation = {};
    analyticsOrders.forEach(o => {
        const city = (o.address && (o.address.city || o.address.cityName)) || 'Unknown';
        salesByLocation[city] = (salesByLocation[city] || 0) + (Number(o.total) || 0);
    });
    const salesByLocationArr = Object.keys(salesByLocation).map(k => ({ city: k, total: salesByLocation[k] })).sort((a,b)=>b.total-a.total);

    // Peak ordering times (hour of day)
    const hourCounts = new Array(24).fill(0);
    analyticsOrders.forEach(o => {
        let d = new Date(o.date || o.createdAt || Date.now());
        if (isNaN(d.getTime())) d = new Date();
        hourCounts[d.getHours()] += 1;
    });

    // Payment methods breakdown
    const paymentCounts = {};
    analyticsOrders.forEach(o => {
        const label = resolvePaymentLabel(o) || 'Unknown';
        paymentCounts[label] = (paymentCounts[label] || 0) + 1;
    });
    const paymentArr = Object.keys(paymentCounts).map(k => ({ method: k, count: paymentCounts[k] }));

    // Render into #analyticsArea
    const area = document.getElementById('analyticsArea');
    if (!area) return;

    // Helper for formatting currency
    const formatCurrency = v => '₱' + Number(v || 0).toFixed(2);

    // KPI cards - styled to match dashboard stat cards (icon + big number + label)
    const formatCurrencyLocal = v => '₱' + Number(v || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    // Use the same .dashboard-stats/.stat-card markup as the main dashboard
    const kpiHTML = `
        <div class="dashboard-stats" style="margin-bottom:0;">
            <div class="stat-card">
                <div class="stat-icon" style="background: rgba(34, 197, 94, 0.2);">
                    <ion-icon name="receipt-outline" style="color: #22c55e;"></ion-icon>
                </div>
                <div class="stat-info">
                    <h3>${totalOrders}</h3>
                    <p>Total Orders</p>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon" style="background: rgba(59, 130, 246, 0.2);">
                    <ion-icon name="cash-outline" style="color: #3b82f6;"></ion-icon>
                </div>
                <div class="stat-info">
                    <h3>${formatCurrencyLocal(totalRevenue)}</h3>
                    <p>Total Revenue</p>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon" style="background: rgba(248, 175, 30, 0.2);">
                    <ion-icon name="stats-chart-outline" style="color: #f8af1e;"></ion-icon>
                </div>
                <div class="stat-info">
                    <h3>${formatCurrencyLocal(avgOrderValue)}</h3>
                    <p>Average Order Value</p>
                </div>
            </div>
        </div>
    `;

    // Helper to render bars list
    const renderBars = (items, valueKey, labelKey, maxWidthPx = 360) => {
        const max = items.length ? Math.max(...items.map(it => it[valueKey])) : 1;
        return items.map(it => `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                <div style="flex:0 0 140px; color:rgba(255,255,255,0.85); font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${it[labelKey]}</div>
                <div style="flex:1; background: rgba(255,255,255,0.04); height:12px; border-radius:8px; position:relative;">
                    <div style="height:12px; border-radius:8px; background: linear-gradient(90deg,#f8af1e,#f59e0b); width: ${Math.round((it[valueKey] / (max || 1)) * 100)}%;"></div>
                </div>
                <div style="width:90px; text-align:right; color:rgba(255,255,255,0.85); font-weight:700;">${it[valueKey]}</div>
            </div>
        `).join('');
    };

    // Helper to render bars with currency label on the right
    const renderCurrencyBars = (items, valueKey, labelKey) => {
        const max = items.length ? Math.max(...items.map(it => it[valueKey])) : 1;
        return items.map(it => `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                <div style="flex:0 0 160px; color:rgba(255,255,255,0.85); font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${it[labelKey]}</div>
                <div style="flex:1; background: rgba(255,255,255,0.04); height:12px; border-radius:8px; position:relative;">
                    <div style="height:12px; border-radius:8px; background: linear-gradient(90deg,#34d399,#60a5fa); width: ${Math.round((it[valueKey] / (max || 1)) * 100)}%;"></div>
                </div>
                <div style="width:110px; text-align:right; color:rgba(255,255,255,0.85); font-weight:700;">${formatCurrencyLocal(it[valueKey])}</div>
            </div>
        `).join('');
    };

    // Best / Least selling columns
    const bestHTML = `
        <div style="flex:1; min-width:280px;">
            <h3 style="margin:0 0 8px 0;">Top 5 Best-Selling Items</h3>
            <div style="height:0; border-top:1px dashed rgba(255,255,255,0.06); margin:8px 0 12px;"></div>
            ${productArray.length ? renderBars(bestSelling, 'count', 'name') : '<p style="color:rgba(255,255,255,0.6);">No product sales yet.</p>'}
            <div style="height:0; border-top:1px dashed rgba(255,255,255,0.06); margin:12px 0 0;"></div>
        </div>
    `;
    // Removed least-selling card per request — we will show Sales by Location next to Best-Selling items

    // Sales by location bars
    const locationHTML = `
        <div style="flex:1; min-width:320px;">
            <h3 style="margin:0 0 8px 0;">Sales by Municipality</h3>
            <div style="height:0; border-top:1px dashed rgba(255,255,255,0.06); margin:8px 0 12px;"></div>
            ${salesByLocationArr.length ? renderBars(salesByLocationArr.map(s=>({ city: s.city, total: Math.round(s.total) })), 'total', 'city') : '<p style="color:rgba(255,255,255,0.6);">No sales data.</p>'}
            <div style="height:0; border-top:1px dashed rgba(255,255,255,0.06); margin:12px 0 0;"></div>
        </div>
    `;

    // Category-based sales: aggregate totals by canonical item categories
    // Use the clothing categories requested by the user
    const canonicalCategories = [
        "Men's Hoodies",
        "Men's Sweatshirts",
        "Women's Hoodies",
        "Women's Sweatshirts",
        "Kid's Hoodies",
        "Kid's Sweatshirts",
        "Baby's Hoodies",
        "Baby's Sweatshirts"
    ];
    const categoryTotals = {};
    // initialize canonical buckets to ensure consistent ordering/labels
    canonicalCategories.forEach(c => categoryTotals[c] = 0);

    const normalizeToCanonical = (raw) => {
        if (!raw) return null;
        // Keep a cleaned tokenized version for pattern matching
        const cleanedTokens = String(raw).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
        const cleaned = cleanedTokens.join('');

        // Direct canonical match by compacted string
        for (const canon of canonicalCategories) {
            const key = canon.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (cleaned.includes(key)) return canon;
        }

        // Helpful token tests for common variants (covers many misspellings and label shapes)
        const has = (tok) => cleanedTokens.some(t => t.indexOf(tok) === 0 || t === tok);

        // Men
        if ((has('men') || has('mens')) && (has('hood') || has('hoodie') || has('hoodies'))) return "Men's Hoodies";
        if ((has('men') || has('mens')) && (has('sweat') || has('sweatshirt') || has('sweatshirts'))) return "Men's Sweatshirts";
        // Women
        if ((has('women') || has('wom') || has('womens') || has('female') || has('lady') || has('ladies')) && (has('hood') || has('hoodie') || has('hoodies'))) return "Women's Hoodies";
        if ((has('women') || has('wom') || has('womens') || has('female') || has('lady') || has('ladies')) && (has('sweat') || has('sweatshirt') || has('sweatshirts'))) return "Women's Sweatshirts";
        // Kid
        if ((has('kid') || has('kids') || has('child') || has('children')) && (has('hood') || has('hoodie') || has('hoodies'))) return "Kid's Hoodies";
        if ((has('kid') || has('kids') || has('child') || has('children')) && (has('sweat') || has('sweatshirt') || has('sweatshirts'))) return "Kid's Sweatshirts";
        // Baby
        if ((has('baby') || has('infant')) && (has('hood') || has('hoodie') || has('hoodies'))) return "Baby's Hoodies";
        if ((has('baby') || has('infant')) && (has('sweat') || has('sweatshirt') || has('sweatshirts'))) return "Baby's Sweatshirts";

        return null;
    };

    // Helper to parse price tolerant of strings with currency symbols
    const parsePrice = v => {
        if (v === undefined || v === null) return 0;
        const n = parseFloat(String(v).replace(/[^0-9.-]+/g, ''));
        return isNaN(n) ? 0 : n;
    };

    // Use analyticsOrders here so cancelled orders are excluded from category totals
    analyticsOrders.forEach(o => {
        (o.items || []).forEach(it => {
            // Try id match first, fall back to case-insensitive name match
            const menuMatch = menuItems.find(m => ((m.id !== undefined && m.id === it.id) || ((m.name || '').toLowerCase() === (it.name || '').toLowerCase()))) || {};
            // prefer explicit category on order item, then menu item category
            const rawCat = (it.category || menuMatch.category || '');
            const canonical = normalizeToCanonical(rawCat) || normalizeToCanonical(menuMatch.category) || 'Uncategorized';
            const price = parsePrice(it.price !== undefined ? it.price : menuMatch.price);
            const qty = Number(it.quantity) || 1;
            categoryTotals[canonical] = (categoryTotals[canonical] || 0) + (price * qty);
        });
    });

    // Build ordered array: canonical categories first (sorted by total desc), then any extra categories
    const canonicalArr = canonicalCategories.map(c => ({ category: c, total: Math.round(categoryTotals[c] || 0) }));
    // Include 'Uncategorized' if present and >0
    const extra = [];
    if (categoryTotals['Uncategorized']) extra.push({ category: 'Uncategorized', total: Math.round(categoryTotals['Uncategorized']) });
    const categoryArr = canonicalArr.concat(extra).sort((a,b) => b.total - a.total).slice(0,8);

    const categoryHTML = `
        <div style="flex:1; min-width:320px;">
            <h3 style="margin:0 0 8px 0;">Category-Based Sales</h3>
            <div style="height:0; border-top:1px dashed rgba(255,255,255,0.06); margin:8px 0 12px;"></div>
            ${categoryArr.length ? renderCurrencyBars(categoryArr, 'total', 'category') : '<p style="color:rgba(255,255,255,0.6);">No category sales yet.</p>'}
            <div style="height:0; border-top:1px dashed rgba(255,255,255,0.06); margin:12px 0 0;"></div>
        </div>
    `;

    // Peak times line chart (simple SVG polyline)
    const maxHour = Math.max(...hourCounts, 1);
    const points = hourCounts.map((c, i) => {
        const x = Math.round((i / 23) * 600);
        const y = Math.round(120 - (c / maxHour) * 100);
        return `${x},${y}`;
    }).join(' ');
    const hoursLabels = hourCounts.map((c, i) => `<span style="display:inline-block;width:24px;text-align:center;color:rgba(255,255,255,0.6);font-size:0.75rem;">${i}</span>`).join('');
    const peakHTML = `
        <div style="flex:1; min-width:320px;">
            <h3 style="margin:0 0 8px 0;">Peak Sales Hours</h3>
            <div style="height:0; border-top:1px dashed rgba(255,255,255,0.06); margin:8px 0 12px;"></div>
            <div style="background: rgba(255,255,255,0.03); padding:12px; border-radius:8px;">
                <svg width="100%" viewBox="0 0 600 140" preserveAspectRatio="none" style="width:100%; height:140px; display:block;">
                    <polyline fill="none" stroke="#60a5fa" stroke-width="3" points="${points}"></polyline>
                    ${hourCounts.map((c, i)=>{
                        const x = Math.round((i / 23) * 600);
                        const y = Math.round(120 - (c / maxHour) * 100);
                        return `<circle cx="${x}" cy="${y}" r="2.2" fill="#60a5fa"></circle>`;
                    }).join('')}
                </svg>
                <div style="margin-top:6px; display:flex; gap:4px; flex-wrap:wrap;">${hoursLabels}</div>
            </div>
            <div style="height:0; border-top:1px dashed rgba(255,255,255,0.06); margin:12px 0 0;"></div>
        </div>
    `;

    // Payment method pie using conic-gradient
    const totalPayments = paymentArr.reduce((s, p) => s + p.count, 0) || 1;
    const colors = ['#34d399','#60a5fa','#f472b6','#fbbf24','#f87171','#a78bfa'];
    let start = 0;
    const slices = paymentArr.map((p, idx) => {
        const perc = (p.count / totalPayments) * 100;
        const from = start; const to = start + perc; start = to;
        return `${colors[idx % colors.length]} ${from}% ${to}%`;
    }).join(', ');
    const paymentLegend = paymentArr.map((p, idx) => `<div style="display:flex; gap:8px; align-items:center; color:rgba(255,255,255,0.8);"><span style="width:12px;height:12px;background:${colors[idx%colors.length]};display:inline-block;border-radius:2px;"></span><strong style="min-width:140px">${p.method}</strong><span style="margin-left:auto;color:rgba(255,255,255,0.7);">${p.count} (${((p.count/totalPayments)*100).toFixed(0)}%)</span></div>`).join('');
    const paymentHTML = `
        <div style="flex:1; min-width:240px;">
            <h3 style="margin:0 0 8px 0;">Payment Methods</h3>
            <div style="height:0; border-top:1px dashed rgba(255,255,255,0.06); margin:8px 0 12px;"></div>
            <div style="display:flex; gap:12px; align-items:center;">
                <div style="width:120px;height:120px;border-radius:999px;background: conic-gradient(${slices});"></div>
                <div style="flex:1">${paymentLegend || '<p style="color:rgba(255,255,255,0.6);">No payment data.</p>'}</div>
            </div>
            <div style="height:0; border-top:1px dashed rgba(255,255,255,0.06); margin:12px 0 0;"></div>
        </div>
    `;

    area.innerHTML = `
        ${kpiHTML}

        <!-- Products containers: separate boxed cards for Best and Least selling lists -->
        <div style="display:flex; gap:18px; flex-wrap:wrap; margin-top:12px;">
            <div style="flex:1; min-width:280px; background: var(--card-bg); border: 1px solid var(--glass-border); border-radius:12px; padding:14px;">
                ${bestHTML}
            </div>
            <div style="flex:1; min-width:320px; background: var(--card-bg); border: 1px solid var(--glass-border); border-radius:12px; padding:14px;">
                ${locationHTML}
            </div>
        </div>

        <div style="display:flex; gap:18px; flex-wrap:wrap; margin-top:6px;">
            <div style="flex:1; min-width:320px; background: var(--card-bg); border: 1px solid var(--glass-border); border-radius:12px; padding:14px;">
                ${categoryHTML}
            </div>
            <div style="flex:1; min-width:240px; background: var(--card-bg); border: 1px solid var(--glass-border); border-radius:12px; padding:14px;">
                ${paymentHTML}
            </div>
        </div>
    `;
}

function hideAllContent() {
    document.querySelectorAll('.dashboard-content').forEach(content => {
        content.style.display = 'none';
    });
}

// ============================================
// DASHBOARD STATS
// ============================================

function loadDashboardStats() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    const pendingOrders = orders.filter(order => order.status === 'Processing').length;
    
    document.getElementById('totalOrders').textContent = orders.length;
    document.getElementById('pendingOrders').textContent = pendingOrders;
    document.getElementById('totalMenuItems').textContent = menuItems.length;
    document.getElementById('totalUsers').textContent = users.length;
}

// Backfill/migrate orders for admin/staff dashboard to ensure payment fields are present
function normalizeOrdersForDashboard() {
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    if (!orders.length) return;

    let changed = false;
    // Use the robust resolver to backfill and normalize orders for dashboard display
    orders = orders.map(o => {
        const updated = { ...o };
        try {
            const resolved = resolvePaymentLabel(updated);
            if (resolved && resolved !== 'Unknown') {
                if (updated.paymentMethodName !== resolved) { updated.paymentMethodName = resolved; changed = true; }
                if (!updated.paymentMethod || updated.paymentMethod !== resolved) { updated.paymentMethod = resolved; changed = true; }
                const nameToId = { 'Cash on Delivery': 'cod', 'GCash': 'gcash', 'Maya': 'maya', 'PayPal': 'paypal' };
                const id = nameToId[resolved] || (typeof updated.paymentMethodId === 'string' ? updated.paymentMethodId : null);
                if (id && updated.paymentMethodId !== id) { updated.paymentMethodId = id; changed = true; }
            } else if (updated.paymentMethodId && typeof updated.paymentMethodId === 'object') {
                // Try to extract id/name from object-shaped paymentMethodId
                const maybe = updated.paymentMethodId.id || updated.paymentMethodId.name;
                if (maybe) {
                    const fix = resolvePaymentLabel({ paymentMethodId: maybe, paymentMethodName: updated.paymentMethodName, paymentMethod: updated.paymentMethod });
                    if (fix && fix !== 'Unknown') {
                        updated.paymentMethodName = fix;
                        updated.paymentMethod = fix;
                    const nameToId = { 'Cash on Delivery': 'cod', 'GCash': 'gcash', 'Maya': 'maya', 'PayPal': 'paypal' };
                        updated.paymentMethodId = nameToId[fix] || String(maybe);
                        changed = true;
                    }
                }
            }
        } catch (e) {
            console.warn('normalizeOrdersForDashboard error for order', updated.id, e);
        }
        return updated;
    });

    if (changed) {
        localStorage.setItem('orders', JSON.stringify(orders));
    }
}


// Resolve payment method label robustly for display (admin/staff helper)
function resolvePaymentLabel(order) {
    // Always try to return one of the canonical display names when possible:
    // 'GCash', 'Maya', 'PayPal'. Accepts strings, objects, different casings
    // and infers from substrings.
    if (!order) return 'Unknown';

    const asString = (val) => {
        if (val === null || val === undefined) return '';
        if (typeof val === 'string') return val;
        if (typeof val === 'number' || typeof val === 'boolean') return String(val);
        try {
            if (typeof val === 'object') {
                if (val.provider) return String(val.provider);
                if (val.name) return String(val.name);
                if (val.type) return String(val.type);
                if (val.id) return String(val.id);
                return JSON.stringify(val);
            }
        } catch (e) { return ''; }
        return '';
    };

    const candidates = [
        asString(order.paymentMethodName),
        asString(order.paymentMethod),
        asString(order.paymentMethodId),
        asString(order.payment),
        asString(order.payment && order.payment.provider),
        asString(order.payment && order.payment.name)
    ].join(' ').toLowerCase();

    const norm = candidates.replace(/[^a-z0-9]/g, '');
    if (norm.includes('cod') || (norm.includes('cash') && norm.includes('delivery'))) return 'Cash on Delivery';
    if (norm.includes('gcash')) return 'GCash';
    if (norm.includes('paymaya') || norm.includes('maya')) return 'Maya';
    if (norm.includes('paypal')) return 'PayPal';

    // Final direct checks (in case a friendly name exists but didn't include tokens)
    const direct = (asString(order.paymentMethodName) || asString(order.paymentMethod) || asString(order.paymentMethodId) || '').trim().toLowerCase();
    if (direct === 'cod' || direct === 'cashondelivery' || direct === 'cash on delivery') return 'Cash on Delivery';
    if (direct === 'gcash') return 'GCash';
    if (direct === 'maya' || direct === 'paymaya') return 'Maya';
    if (direct === 'paypal') return 'PayPal';

    return 'Unknown';
}


function loadRecentOrders() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const recentOrders = orders.slice(-5).reverse();
    
    const ordersList = document.getElementById('recentOrdersList');
    
    if (recentOrders.length === 0) {
        ordersList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">
                <ion-icon name="receipt-outline" style="font-size: 3rem; margin-bottom: 10px;"></ion-icon>
                <p>No orders yet</p>
            </div>
        `;
        return;
    }
    
    // Map payment method for display
    const methodMap = { cod: 'Cash on Delivery', gcash: 'GCash', maya: 'Maya', paypal: 'PayPal' };
    ordersList.innerHTML = recentOrders.map(order => {
        const orderDate = new Date(order.date);
        const statusColor = getStatusColor(order.status);
    // Resolve payment method name using helper
    let paymentMethod = resolvePaymentLabel(order);
        return `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <h3>Order #${order.id}</h3>
                        <p class="order-date">${orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span class="status-badge" style="background: ${statusColor}20; color: ${statusColor}; border: 1px solid ${statusColor}40;">
                        ${order.status}
                    </span>
                </div>
                <div class="order-details">
                    <p><ion-icon name="location-outline"></ion-icon> ${order.address.city}, ${order.address.state}</p>
                    <p><ion-icon name="card-outline"></ion-icon> ${paymentMethod}</p>
                    <p><strong style="color: #f8af1e;">Total: ₱${formatCurrency(order.total)}</strong></p>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// ORDER MANAGEMENT
// ============================================

let currentFilter = 'all';

function loadAllOrders() {
    filterOrders(currentFilter);
}

function filterOrders(status) {
    currentFilter = status;
    
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    let filteredOrders = status === 'all' ? orders : orders.filter(order => order.status === status);
    filteredOrders = filteredOrders.reverse();
    
    const ordersList = document.getElementById('ordersList');
    
    if (filteredOrders.length === 0) {
        ordersList.innerHTML = `
            <div style="text-align: center; padding: 60px; color: rgba(255,255,255,0.6);">
                <ion-icon name="receipt-outline" style="font-size: 4rem; margin-bottom: 15px;"></ion-icon>
                <h3 style="color: rgba(255,255,255,0.8); margin-bottom: 10px;">No ${status === 'all' ? '' : status} Orders</h3>
                <p>There are no ${status === 'all' ? '' : status.toLowerCase()} orders at the moment.</p>
            </div>
        `;
        return;
    }
    
    ordersList.innerHTML = filteredOrders.map(order => {
        const orderDate = new Date(order.date);
        const statusColor = getStatusColor(order.status);
        const currentStaff = JSON.parse(localStorage.getItem('currentStaff'));
        const isAdmin = currentStaff.role === 'admin';
        
        return `
            <div class="order-card detailed">
                <div class="order-header">
                    <div>
                        <h3>Order #${order.id}</h3>
                        <p class="order-date">${orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div class="order-actions">
                        ${order.status === 'Cancelled' ? `
                            <button onclick="showOrderItems(${order.id})" class="action-btn" style="
                                padding: 8px 12px;
                                border-radius: 8px;
                                border: 1px solid rgba(99, 102, 241, 0.15);
                                background: rgba(99, 102, 241, 0.08);
                                color: #6366f1;
                                font-weight: 600;
                                cursor: pointer;
                                outline: none;
                            ">
                                <ion-icon name="eye-outline" style="vertical-align: middle;"></ion-icon>
                                View Items
                            </button>
                            ${isAdmin ? `
                            <button onclick="deleteOrder(${order.id})" class="action-btn" style="
                                padding: 8px 12px;
                                border-radius: 8px;
                                border: 1px solid rgba(0,0,0,0.15);
                                background: rgba(0,0,0,0.6);
                                color: #ffffff;
                                font-weight: 600;
                                cursor: pointer;
                                outline: none;
                                margin-left: 8px;
                            ">
                                <ion-icon name="trash-outline" style="vertical-align: middle;"></ion-icon>
                                Delete
                            </button>
                            ` : ''}
                        ` : `
                        <select onchange="updateOrderStatus(${order.id}, this.value)" class="status-select" style="
                            padding: 8px 12px;
                            border-radius: 8px;
                            border: 1px solid ${statusColor}40;
                            background: ${statusColor}20;
                            color: ${statusColor};
                            font-weight: 600;
                            cursor: pointer;
                            outline: none;
                        ">
                                <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                                <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>Preparing</option>
                                <option value="Shipping" ${order.status === 'Shipping' ? 'selected' : ''}>Shipping</option>
                                <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        </select>
                        <button onclick="showOrderItems(${order.id})" class="action-btn" style="
                            padding: 8px 12px;
                            border-radius: 8px;
                            border: 1px solid rgba(99, 102, 241, 0.15);
                            background: rgba(99, 102, 241, 0.08);
                            color: #6366f1;
                            font-weight: 600;
                            cursor: pointer;
                            outline: none;
                            margin-left: 8px;
                        ">
                            <ion-icon name="eye-outline" style="vertical-align: middle;"></ion-icon>
                            View Items
                        </button>
                        ${isAdmin ? `
                        <button onclick="cancelOrder(${order.id})" class="action-btn" style="
                            padding: 8px 12px;
                            border-radius: 8px;
                            border: 1px solid rgba(239, 68, 68, 0.4);
                            background: rgba(239, 68, 68, 0.12);
                            color: #ef4444;
                            font-weight: 600;
                            cursor: pointer;
                            outline: none;
                            margin-left: 8px;
                        ">
                            <ion-icon name="close-circle-outline" style="vertical-align: middle;"></ion-icon>
                            Cancel
                        </button>

                        <button onclick="deleteOrder(${order.id})" class="action-btn" style="
                            padding: 8px 12px;
                            border-radius: 8px;
                            border: 1px solid rgba(0,0,0,0.15);
                            background: rgba(0,0,0,0.6);
                            color: #ffffff;
                            font-weight: 600;
                            cursor: pointer;
                            outline: none;
                            margin-left: 8px;
                        ">
                            <ion-icon name="trash-outline" style="vertical-align: middle;"></ion-icon>
                            Delete
                        </button>
                        ` : ''}
                        `}
                    </div>
                </div>
                <div class="order-details">
                    <div class="order-info">
                        <p><ion-icon name="person-outline"></ion-icon> ${order.address.name}</p>
                        <p><ion-icon name="location-outline"></ion-icon> ${order.address.address}, ${order.address.city}, ${order.address.state} ${order.address.zipCode}</p>
                        <p><ion-icon name="call-outline"></ion-icon> ${order.address.phone}</p>
                        <p><ion-icon name="card-outline"></ion-icon> ${resolvePaymentLabel(order)}</p>
                    </div>
                    <div class="order-total">
                        <h3 style="color: #f8af1e; font-size: 1.5rem;">₱${formatCurrency(order.total)}</h3>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateOrderStatus(orderId, newStatus) {
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    const orderIndex = orders.findIndex(order => order.id === orderId);
    
    if (orderIndex !== -1) {
        // Prevent changing status of orders that have been cancelled
        if (orders[orderIndex].status === 'Cancelled') {
            showAlert('error', `Cannot change status of cancelled Order #${orderId}.`);
            return;
        }
        orders[orderIndex].status = newStatus;
        localStorage.setItem('orders', JSON.stringify(orders));
        showAlert('success', `Order #${orderId} status updated to ${newStatus}`);
        loadAllOrders();
        loadDashboardStats();
    }
}

function deleteOrder(orderId) {
    const currentStaff = JSON.parse(localStorage.getItem('currentStaff'));
    if (currentStaff.role !== 'admin') {
        showAlert('error', 'Access denied! Only administrators can delete orders.');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete Order #${orderId}? This action cannot be undone.`)) {
        return;
    }
    
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders = orders.filter(order => order.id !== orderId);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    showAlert('success', `Order #${orderId} has been deleted successfully!`);
    loadAllOrders();
    loadDashboardStats();
    loadRecentOrders();
}

function getStatusColor(status) {
    switch(status) {
        case 'Processing': return '#f8af1e';
        case 'Preparing': return '#f8af1e';
        case 'Shipping': return '#3b82f6';
        case 'Delivered': return '#22c55e';
        case 'Cancelled': return '#ef4444';
        default: return '#6b7280';
    }
}

// ============================================
// MENU MANAGEMENT
// ============================================

function loadViewMenuItems() {
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    const menuList = document.getElementById('viewMenuItemsList');
    
    if (menuItems.length === 0) {
        menuList.innerHTML = `
            <div style="text-align: center; padding: 60px; color: rgba(255,255,255,0.6);">
                <ion-icon name="restaurant-outline" style="font-size: 4rem; margin-bottom: 15px;"></ion-icon>
                <h3 style="color: rgba(255,255,255,0.8); margin-bottom: 10px;">No Products</h3>
                <p>No products available at the moment.</p>
            </div>
        `;
        return;
    }
    
    menuList.innerHTML = menuItems.map(item => `
        <div class="menu-item-card">
            <div class="menu-item-image">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='../static/images/placeholder.jpg'">
                <span class="availability-badge ${item.available ? 'available' : 'unavailable'}">
                    ${item.available ? 'Available' : 'Unavailable'}${(item.unavailableVariants && item.unavailableVariants.length>0) ? ' • Some variants unavailable' : ''}
                </span>
            </div>
            <div class="menu-item-info">
                <h3>${item.name}</h3>
                <p class="category">${item.category}</p>
                <p class="price">₱${formatCurrency(item.price)}</p>
            </div>
            <div class="menu-item-status" style="padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; text-align: center;">
                <p style="margin: 0; color: ${item.available ? '#22c55e' : '#ef4444'}; font-weight: 600;">
                    <ion-icon name="${item.available ? 'checkmark-circle' : 'close-circle'}" style="vertical-align: middle; font-size: 1.2rem;"></ion-icon>
                    ${item.available ? 'Currently Available' : 'Currently Unavailable'}
                </p>
            </div>
        </div>
    `).join('');
}

function loadMenuItems() {
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    const menuList = document.getElementById('menuItemsList');
    
    if (menuItems.length === 0) {
        menuList.innerHTML = `
            <div style="text-align: center; padding: 60px; color: rgba(255,255,255,0.6);">
                <ion-icon name="restaurant-outline" style="font-size: 4rem; margin-bottom: 15px;"></ion-icon>
                <h3 style="color: rgba(255,255,255,0.8); margin-bottom: 10px;">No Products</h3>
                <p>Start by adding your first product.</p>
            </div>
        `;
        return;
    }
    
    menuList.innerHTML = menuItems.map(item => `
        <div class="menu-item-card">
            <div class="menu-item-image">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='../static/images/placeholder.jpg'">
                <span class="availability-badge ${item.available ? 'available' : 'unavailable'}">
                    ${item.available ? 'Available' : 'Unavailable'}${(item.unavailableVariants && item.unavailableVariants.length>0) ? ' • Some variants unavailable' : ''}
                </span>
            </div>
            <div class="menu-item-info">
                <h3>${item.name}</h3>
                <p class="category">${item.category}</p>
                <p class="price">₱${formatCurrency(item.price)}</p>
            </div>
            <div class="menu-item-actions">
                <button onclick="manageAvailability(${item.id})" class="action-btn" style="background: ${item.available ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}; color: ${item.available ? '#ef4444' : '#22c55e'};">
                    <ion-icon name="${item.available ? 'close-circle-outline' : 'checkmark-circle-outline'}"></ion-icon>
                    ${item.available ? 'Disable' : 'Enable'}
                </button>
                <button onclick="editMenuItem(${item.id})" class="action-btn" style="background: rgba(59, 130, 246, 0.2); color: #3b82f6;">
                    <ion-icon name="create-outline"></ion-icon>
                    Edit
                </button>
                <button onclick="deleteMenuItem(${item.id})" class="action-btn" style="background: rgba(239, 68, 68, 0.2); color: #ef4444;">
                    <ion-icon name="trash-outline"></ion-icon>
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

function searchMenuItems(searchTerm) {
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    const menuList = document.getElementById('menuItemsList');
    
    // Filter items based on search term
    const filteredItems = menuItems.filter(item => {
        const searchLower = searchTerm.toLowerCase().trim();
        const itemName = (item.name || '').toLowerCase();
        const itemCategory = (item.category || '').toLowerCase();
        
        return itemName.includes(searchLower) || itemCategory.includes(searchLower);
    });
    
    // Display filtered results
    if (filteredItems.length === 0) {
        menuList.innerHTML = `
            <div style="text-align: center; padding: 60px; color: rgba(255,255,255,0.6);">
                <ion-icon name="search-outline" style="font-size: 4rem; margin-bottom: 15px;"></ion-icon>
                <h3 style="color: rgba(255,255,255,0.8); margin-bottom: 10px;">No Results Found</h3>
                <p>No menu items match "${searchTerm}"</p>
            </div>
        `;
        return;
    }
    
    menuList.innerHTML = filteredItems.map(item => `
        <div class="menu-item-card">
            <div class="menu-item-image">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='../static/images/placeholder.jpg'">
                <span class="availability-badge ${item.available ? 'available' : 'unavailable'}">
                    ${item.available ? 'Available' : 'Unavailable'}${(item.unavailableVariants && item.unavailableVariants.length>0) ? ' • Some variants unavailable' : ''}
                </span>
            </div>
            <div class="menu-item-info">
                <h3>${item.name}</h3>
                <p class="category">${item.category}</p>
                <p class="price">₱${formatCurrency(item.price)}</p>
            </div>
            <div class="menu-item-actions">
                <button onclick="manageAvailability(${item.id})" class="action-btn" style="background: ${item.available ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}; color: ${item.available ? '#ef4444' : '#22c55e'};">
                    <ion-icon name="${item.available ? 'close-circle-outline' : 'checkmark-circle-outline'}"></ion-icon>
                    ${item.available ? 'Disable' : 'Enable'}
                </button>
                <button onclick="editMenuItem(${item.id})" class="action-btn" style="background: rgba(59, 130, 246, 0.2); color: #3b82f6;">
                    <ion-icon name="create-outline"></ion-icon>
                    Edit
                </button>
                <button onclick="deleteMenuItem(${item.id})" class="action-btn" style="background: rgba(239, 68, 68, 0.2); color: #ef4444;">
                    <ion-icon name="trash-outline"></ion-icon>
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

function searchViewMenuItems(searchTerm) {
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    const menuList = document.getElementById('viewMenuItemsList');
    
    // Filter items based on search term
    const filteredItems = menuItems.filter(item => {
        const searchLower = searchTerm.toLowerCase().trim();
        const itemName = (item.name || '').toLowerCase();
        const itemCategory = (item.category || '').toLowerCase();
        
        return itemName.includes(searchLower) || itemCategory.includes(searchLower);
    });
    
    // Display filtered results
    if (filteredItems.length === 0) {
        menuList.innerHTML = `
            <div style="text-align: center; padding: 60px; color: rgba(255,255,255,0.6);">
                <ion-icon name="search-outline" style="font-size: 4rem; margin-bottom: 15px;"></ion-icon>
                <h3 style="color: rgba(255,255,255,0.8); margin-bottom: 10px;">No Results Found</h3>
                <p>No menu items match "${searchTerm}"</p>
            </div>
        `;
        return;
    }
    
    menuList.innerHTML = filteredItems.map(item => `
        <div class="menu-item-card">
            <div class="menu-item-image">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='../static/images/placeholder.jpg'">
                <span class="availability-badge ${item.available ? 'available' : 'unavailable'}">
                    ${item.available ? 'Available' : 'Unavailable'}${(item.unavailableVariants && item.unavailableVariants.length>0) ? ' • Some variants unavailable' : ''}
                </span>
            </div>
            <div class="menu-item-info">
                <h3>${item.name}</h3>
                <p class="category">${item.category}</p>
                <p class="price">₱${formatCurrency(item.price)}</p>
            </div>
            <div class="menu-item-status" style="padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; text-align: center;">
                <p style="margin: 0; color: ${item.available ? '#22c55e' : '#ef4444'}; font-weight: 600;">
                    <ion-icon name="${item.available ? 'checkmark-circle' : 'close-circle'}" style="vertical-align: middle; font-size: 1.2rem;"></ion-icon>
                    ${item.available ? 'Currently Available' : 'Currently Unavailable'}
                </p>
            </div>
        </div>
    `).join('');
}

function showAddMenuItemForm() {
    const formHTML = `
        <div class="modal-overlay" id="menuItemModal" onclick="if(event.target === this) closeMenuItemModal()">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Add New Product</h2>
                    <button onclick="closeMenuItemModal()" class="close-btn">
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>
                <form onsubmit="saveMenuItem(event)">
                    <div class="form-group">
                        <label>Product Name *</label>
                        <input type="text" id="itemName" required>
                    </div>
                    <div class="form-group">
                        <label>Price (₱) *</label>
                        <input type="number" id="itemPrice" step="0.01" min="0" required>
                    </div>
                    <div class="form-group">
                        <label>Category *</label>
                        <select id="itemCategory" required>
                            <option value="">Select Category</option>
                            <option value="Men's Hoodies">Men's Hoodies</option>
                            <option value="Men's Sweatshirts">Men's Sweatshirts</option>
                            <option value="Women's Hoodies">Women's Hoodies</option>
                            <option value="Women's Sweatshirts">Women's Sweatshirts</option>
                            <option value="Kid's Hoodies">Kid's Hoodies</option>
                            <option value="Kid's Sweatshirts">Kid's Sweatshirts</option>
                            <option value="Baby's Hoodies">Baby's Hoodies</option>
                            <option value="Baby's Sweatshirts">Baby's Sweatshirts</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Image URL</label>
                        <input type="text" id="itemImage" placeholder="../static/images/menu-items/item.jpg">
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="itemAvailable" checked>
                            Available for order
                        </label>
                    </div>
                    <button type="submit" class="submit-btn">Add Product</button>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', formHTML);
}

function saveMenuItem(event) {
    event.preventDefault();
    
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    const newId = menuItems.length > 0 ? Math.max(...menuItems.map(item => item.id)) + 1 : 1;
    
    const newItem = {
        id: newId,
        name: document.getElementById('itemName').value,
        price: parseFloat(document.getElementById('itemPrice').value),
        category: document.getElementById('itemCategory').value,
        image: document.getElementById('itemImage').value || '../static/images/placeholder.jpg',
        available: document.getElementById('itemAvailable').checked
    };
    
    menuItems.push(newItem);
    localStorage.setItem('menuItems', JSON.stringify(menuItems));
    
    closeMenuItemModal();
    showAlert('success', 'Menu item added successfully!');
    loadMenuItems();
    loadDashboardStats();
}

function editMenuItem(itemId) {
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    const item = menuItems.find(i => i.id === itemId);
    
    if (!item) return;
    
    const formHTML = `
        <div class="modal-overlay" id="menuItemModal" onclick="if(event.target === this) closeMenuItemModal()">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit Product Details</h2>
                    <button onclick="closeMenuItemModal()" class="close-btn">
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>
                <form onsubmit="updateMenuItem(event, ${itemId})">
                    <div class="form-group">
                        <label>Item Name *</label>
                        <input type="text" id="itemName" value="${item.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Price (₱) *</label>
                        <input type="number" id="itemPrice" value="${item.price}" step="0.01" min="0" required>
                    </div>
                    <div class="form-group">
                        <label>Category *</label>
                        <select id="itemCategory" required>
                            <option value="">Select Category</option>
                            <option value="Men's Hoodies" ${item.category === "Men's Hoodies" ? 'selected' : ''}>Men's Hoodies</option>
                            <option value="Men's Sweatshirts" ${item.category === "Men's Sweatshirts" ? 'selected' : ''}>Men's Sweatshirts</option>
                            <option value="Women's Hoodies" ${item.category === "Women's Hoodies" ? 'selected' : ''}>Women's Hoodies</option>
                            <option value="Women's Sweatshirts" ${item.category === "Women's Sweatshirts" ? 'selected' : ''}>Women's Sweatshirts</option>
                            <option value="Kid's Hoodies" ${item.category === "Kid's Hoodies" ? 'selected' : ''}>Kid's Hoodies</option>
                            <option value="Kid's Sweatshirts" ${item.category === "Kid's Sweatshirts" ? 'selected' : ''}>Kid's Sweatshirts</option>
                            <option value="Baby's Hoodies" ${item.category === "Baby's Hoodies" ? 'selected' : ''}>Baby's Hoodies</option>
                            <option value="Baby's Sweatshirts" ${item.category === "Baby's Sweatshirts" ? 'selected' : ''}>Baby's Sweatshirts</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Image URL</label>
                        <input type="text" id="itemImage" value="${item.image}">
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="itemAvailable" ${item.available ? 'checked' : ''}>
                            Available for order
                        </label>
                    </div>
                    <button type="submit" class="submit-btn">Update Product Details</button>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', formHTML);
}

function updateMenuItem(event, itemId) {
    event.preventDefault();
    
    let menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    const itemIndex = menuItems.findIndex(i => i.id === itemId);
    
    if (itemIndex !== -1) {
        menuItems[itemIndex] = {
            ...menuItems[itemIndex],
            name: document.getElementById('itemName').value,
            price: parseFloat(document.getElementById('itemPrice').value),
            category: document.getElementById('itemCategory').value,
            image: document.getElementById('itemImage').value,
            available: document.getElementById('itemAvailable').checked
        };
        
        localStorage.setItem('menuItems', JSON.stringify(menuItems));
        closeMenuItemModal();
        showAlert('success', 'Menu item updated successfully!');
        loadMenuItems();
    }
}

function toggleAvailability(itemId) {
    let menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    const itemIndex = menuItems.findIndex(i => i.id === itemId);
    
    if (itemIndex !== -1) {
        menuItems[itemIndex].available = !menuItems[itemIndex].available;
        localStorage.setItem('menuItems', JSON.stringify(menuItems));
        showAlert('success', `Menu item ${menuItems[itemIndex].available ? 'enabled' : 'disabled'} successfully!`);
        loadMenuItems();
    }
}

function deleteMenuItem(itemId) {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    
    let menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    menuItems = menuItems.filter(i => i.id !== itemId);
    localStorage.setItem('menuItems', JSON.stringify(menuItems));
    
    showAlert('success', 'Menu item deleted successfully!');
    loadMenuItems();
    loadDashboardStats();
}

function closeMenuItemModal() {
    const modal = document.getElementById('menuItemModal');
    if (modal) modal.remove();
}

// ============================================
// USER MANAGEMENT
// ============================================

function showUserTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    document.getElementById('customersTab').style.display = tab === 'customers' ? 'block' : 'none';
    document.getElementById('staffTab').style.display = tab === 'staff' ? 'block' : 'none';
    
    if (tab === 'customers') {
        loadCustomers();
    } else {
        loadStaff();
    }
}

function loadCustomers() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const customersList = document.getElementById('customersList');
    
    if (users.length === 0) {
        customersList.innerHTML = `
            <div style="text-align: center; padding: 60px; color: rgba(255,255,255,0.6);">
                <ion-icon name="people-outline" style="font-size: 4rem; margin-bottom: 15px;"></ion-icon>
                <h3 style="color: rgba(255,255,255,0.8); margin-bottom: 10px;">No Customers</h3>
                <p>No customers have registered yet.</p>
            </div>
        `;
        return;
    }
    
    customersList.innerHTML = users.map((user, index) => {
        const joinDate = new Date(user.createdAt);
        return `
            <div class="user-card">
                <div class="user-avatar">
                    ${user.name.charAt(0).toUpperCase()}
                </div>
                <div class="user-info">
                    <h3>${user.name}</h3>
                    <p>${user.email}</p>
                    <p class="join-date">Joined: ${joinDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div class="user-actions">
                    <button onclick="deleteCustomer(${index})" class="action-btn" style="background: rgba(239, 68, 68, 0.2); color: #ef4444;">
                        <ion-icon name="trash-outline"></ion-icon>
                        Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function deleteCustomer(index) {
    if (!confirm('Are you sure you want to delete this customer account?')) return;
    
    let users = JSON.parse(localStorage.getItem('users')) || [];
    users.splice(index, 1);
    localStorage.setItem('users', JSON.stringify(users));
    
    showAlert('success', 'Customer account deleted successfully!');
    loadCustomers();
    loadDashboardStats();
}

function loadStaff() {
    const staffAccounts = JSON.parse(localStorage.getItem('staffAccounts')) || [];
    const staffList = document.getElementById('staffList');
    
    staffList.innerHTML = staffAccounts.map((staff, index) => {
        const joinDate = new Date(staff.createdAt);
        return `
            <div class="user-card">
                <div class="user-avatar" style="background: ${staff.role === 'admin' ? 'linear-gradient(135deg, #a855f7, #8b5cf6)' : 'linear-gradient(135deg, #3b82f6, #2563eb)'};">
                    ${staff.name.charAt(0).toUpperCase()}
                </div>
                <div class="user-info">
                    <h3>${staff.name}</h3>
                    <p>${staff.email}</p>
                    <p class="join-date">
                        <span class="role-badge" style="background: ${staff.role === 'admin' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(59, 130, 246, 0.2)'}; color: ${staff.role === 'admin' ? '#a855f7' : '#3b82f6'};">
                            ${staff.role === 'admin' ? 'Administrator' : 'Staff'}
                        </span>
                    </p>
                </div>
                <div class="user-actions">
                    <button onclick="deleteStaff(${staff.id})" class="action-btn" style="background: rgba(239, 68, 68, 0.2); color: #ef4444;">
                        <ion-icon name="trash-outline"></ion-icon>
                        Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function showAddStaffForm() {
    const formHTML = `
        <div class="modal-overlay" id="staffModal" onclick="if(event.target === this) closeStaffModal()">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Add Staff Member</h2>
                    <button onclick="closeStaffModal()" class="close-btn">
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>
                <form onsubmit="saveStaff(event)">
                    <div class="form-group">
                        <label>Full Name *</label>
                        <input type="text" id="staffName" required>
                    </div>
                    <div class="form-group">
                        <label>Email Address *</label>
                        <input type="email" id="staffEmail" required>
                    </div>
                    <div class="form-group">
                        <label>Password *</label>
                        <input type="password" id="staffPassword" minlength="6" required>
                    </div>
                    <!-- Role is fixed to 'staff' for newly added accounts -->
                    <button type="submit" class="submit-btn">Add Staff Member</button>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', formHTML);
}

function saveStaff(event) {
    event.preventDefault();
    
    const staffAccounts = JSON.parse(localStorage.getItem('staffAccounts')) || [];
    const email = document.getElementById('staffEmail').value;
    
    // Check if email already exists
    if (staffAccounts.some(s => s.email === email)) {
        showAlert('error', 'Email already exists!');
        return;
    }
    
    const newId = staffAccounts.length > 0 ? Math.max(...staffAccounts.map(s => s.id)) + 1 : 1;
    
    const newStaff = {
        id: newId,
        name: document.getElementById('staffName').value,
        email: email,
        password: document.getElementById('staffPassword').value,
        role: 'staff',
        createdAt: new Date().toISOString()
    };
    
    staffAccounts.push(newStaff);
    localStorage.setItem('staffAccounts', JSON.stringify(staffAccounts));
    
    closeStaffModal();
    showAlert('success', 'Staff member added successfully!');
    loadStaff();
}

function deleteStaff(staffId) {
    const currentStaff = JSON.parse(localStorage.getItem('currentStaff'));
    
    if (currentStaff.id === staffId) {
        showAlert('error', 'You cannot delete your own account!');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    
    let staffAccounts = JSON.parse(localStorage.getItem('staffAccounts')) || [];
    staffAccounts = staffAccounts.filter(s => s.id !== staffId);
    localStorage.setItem('staffAccounts', JSON.stringify(staffAccounts));
    
    showAlert('success', 'Staff member deleted successfully!');
    loadStaff();
}

function closeStaffModal() {
    const modal = document.getElementById('staffModal');
    if (modal) modal.remove();
}

// Show a modal listing ordered items for a given order id
function showOrderItems(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(o => o.id === orderId);
    if (!order) {
        showAlert('error', 'Order not found.');
        return;
    }

    const items = order.items || order.cart || [];

    let html = `
        <div class="shipping-address-form" style="color: white; backdrop-filter: blur(20px); max-height: 90vh; display: flex; flex-direction: column;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:12px; border-bottom:2px solid #f8af1e;">
                <h2 style="color:#f8af1e; margin:0; font-size:1.5rem; display:flex; align-items:center; gap:10px;"><ion-icon name="cube-outline" style="font-size:1.6rem"></ion-icon> Ordered Items</h2>
                <button onclick="closeOrderItemsModal()" style="background:transparent; border:none; color:#f8af1e; font-size:1.6rem; cursor:pointer;"><ion-icon name="close-outline"></ion-icon></button>
            </div>
            <div style="flex:1; overflow-y:auto;">
    `;

    if (!items || items.length === 0) {
        html += `
            <div style="text-align:center; padding:40px; color: rgba(255,255,255,0.7);">
                <ion-icon name="help-circle-outline" style="font-size:3rem; margin-bottom:10px;"></ion-icon>
                <p>No item details saved for this order.</p>
            </div>
        `;
    } else {
        html += `<div style="display:flex; flex-direction:column; gap:12px;">`;
        items.forEach(it => {
            const price = parseFloat(String(it.price || it.unitPrice || '0').replace(/[^0-9.-]+/g, '')) || 0;
            const qty = it.quantity || 1;
            const itemTotal = price * qty;
            const variantInfo = ((it.color || it.size) ? `<div style="color: rgba(255,255,255,0.6); font-size:0.95rem; margin-top:6px;">${it.color ? 'Color: ' + it.color : ''}${(it.color && it.size) ? ' | ' : ''}${it.size ? 'Size: ' + it.size : ''}</div>` : '');
            html += `
                <div style="background: rgba(255,255,255,0.03); padding:12px; border-radius:10px; display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; gap:12px; align-items:center; min-width:0;">
                        <img src="${it.image || '../static/images/placeholder.jpg'}" alt="${it.name}" style="width:56px; height:56px; object-fit:cover; border-radius:8px;">
                        <div style="min-width:0;">
                            <div style="font-weight:700; color:white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${it.name}</div>
                            <div style="color:rgba(255,255,255,0.65); font-size:0.9rem;">₱${formatCurrency(price)} &times; ${qty}</div>
                            ${variantInfo}
                        </div>
                    </div>
                    <div style="font-weight:700; color:#f8af1e;">₱${formatCurrency(itemTotal)}</div>
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `
            </div>
    `;

    // Compute amounts (use saved values when available, otherwise derive)
    const subtotal = (typeof order.subtotal === 'number') ? order.subtotal : (() => {
        let s = 0;
        (items || []).forEach(it => {
            const price = parseFloat(String(it.price || it.unitPrice || '0').replace(/[^0-9.-]+/g, '')) || 0;
            const qty = it.quantity || 1;
            s += price * qty;
        });
        return parseFloat(s.toFixed(2));
    })();
    const shippingFee = (typeof order.shippingFee === 'number') ? order.shippingFee : (typeof getShippingFee === 'function' ? getShippingFee() : 0);
    const total = (typeof order.total === 'number') ? order.total : parseFloat((subtotal + shippingFee).toFixed(2));

    // Summary block: Subtotal, Shipping Fee, Total
    html += `
            <div style="margin-top:16px; padding:14px; border-top:1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); border-radius: 10px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <div style="color:rgba(255,255,255,0.8)">Subtotal</div>
                    <div style="color:#f8af1e; font-weight:700">₱${formatCurrency(subtotal)}</div>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <div style="color:rgba(255,255,255,0.8)">Shipping Fee</div>
                    <div style="color:#f8af1e; font-weight:700">₱${formatCurrency(shippingFee)}</div>
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:6px; padding-top:6px; border-top:1px dashed rgba(255,255,255,0.04);">
                    <div style="color:white; font-weight:700">Total</div>
                    <div style="color:#f8af1e; font-weight:900; font-size:1.1rem">₱${formatCurrency(total)}</div>
                </div>
            </div>
    `;

    html += `
            <div style="display:flex; gap:10px; margin-top:12px;">
                <button onclick="closeOrderItemsModal()" style="background:#f8af1e; color:#000; border:none; padding:10px 14px; border-radius:8px; font-weight:700; cursor:pointer;">Close</button>
            </div>
        </div>
    `;

    const modal = document.createElement('div');
    modal.id = 'orderItemsModal';
    modal.style.cssText = `position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.92); z-index:10000; display:flex; align-items:center; justify-content:center; overflow-y:auto; padding:20px 0;`;
    modal.innerHTML = html;
    modal.addEventListener('click', function(e) { if (e.target === modal) closeOrderItemsModal(); });
    document.body.appendChild(modal);
}

function closeOrderItemsModal() { const m = document.getElementById('orderItemsModal'); if (m) m.remove(); }

// Manage availability with variant-level control
function manageAvailability(itemId) {
    showManageAvailabilityModal(itemId);
}

function showManageAvailabilityModal(itemId) {
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    const itemIndex = menuItems.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;
    const item = menuItems[itemIndex];

    // Ensure structure for unavailable variants
    item.unavailableVariants = item.unavailableVariants || [];

    const colors = ['Beige', 'Black', 'Blue', 'Sage', 'White'];
    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

    let variantsListHTML = '';
    if (item.unavailableVariants.length === 0) {
        variantsListHTML = '<p style="color: rgba(255,255,255,0.7); padding:8px 12px; margin:0;">No variants marked unavailable.</p>';
    } else {
        variantsListHTML = item.unavailableVariants.map((v, idx) => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; border-bottom:1px dashed rgba(255,255,255,0.04);">
                <div style="color: rgba(255,255,255,0.85);">${v.color ? 'Color: ' + v.color : ''}${(v.color && v.size) ? ' | ' : ''}${v.size ? 'Size: ' + v.size : ''}</div>
                <button onclick="removeUnavailableVariant(${itemId}, ${idx})" style="background: rgba(239,68,68,0.15); color:#ef4444; border:none; padding:6px 10px; border-radius:6px; cursor:pointer;">Remove</button>
            </div>
        `).join('');
    }

    const modalHTML = `
        <div class="modal-overlay" id="manageAvailabilityModal" onclick="if(event.target === this) closeManageAvailabilityModal()">
            <div class="modal-content" style="max-width:600px;">
                <div class="modal-header">
                    <h2>${item.name}</h2>
                    <button onclick="closeManageAvailabilityModal()" class="close-btn"><ion-icon name="close-outline"></ion-icon></button>
                </div>
                <div style="padding:12px 0;">
                    <p style="color: rgba(255,255,255,0.8); margin:0 0 12px 0;">Whole item is currently: <strong style="color:#f8af1e;">${item.available ? 'Available' : 'Unavailable'}</strong></p>
                    <div style="display:flex; gap:10px; margin-bottom:12px;">
                        <button onclick="toggleWholeAvailability(${itemId})" style="flex:1; background:${item.available ? 'rgba(239,68,68,0.2)' : '#22c55e'}; color:${item.available ? '#ef4444' : '#000'}; border:none; padding:10px 12px; border-radius:8px; font-weight:700; cursor:pointer;">${item.available ? 'Disable Whole Item' : 'Enable Whole Item'}</button>
                        <button onclick="closeManageAvailabilityModal()" style="flex:1; background:transparent; border:1px solid rgba(255,255,255,0.08); color:#fff; padding:10px 12px; border-radius:8px;">Close</button>
                    </div>

                    <h4 style="color: rgba(255,255,255,0.85); margin-top:6px;">Unavailable Variants</h4>
                    <div style="margin-bottom:12px; padding:6px 0;">${variantsListHTML}</div>

                    <h4 style="color: rgba(255,255,255,0.85); margin-top:6px; margin-bottom:8px;">Add Unavailable Variant</h4>
                    <div style="display:flex; gap:10px; margin:8px 0 12px 0;">
                        <select id="variantColorSelect" style="flex:1; padding:8px; border-radius:6px; background: rgba(255,255,255,0.03); color: white; border: 1px solid rgba(255,255,255,0.06);">
                            <option value="">-- Select Color --</option>
                            ${colors.map(c=>`<option value="${c}" style="color:#000; background:#fff">${c}</option>`).join('')}
                        </select>
                        <select id="variantSizeSelect" style="flex:1; padding:8px; border-radius:6px; background: rgba(255,255,255,0.03); color: white; border: 1px solid rgba(255,255,255,0.06);">
                            <option value="">-- Select Size --</option>
                            ${sizes.map(s=>`<option value="${s}" style="color:#000; background:#fff">${s}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div style="display:flex; gap:10px; margin-bottom:12px;">
                        <button id="addVariantBtn" style="flex:1; background:#f8af1e; color:#000; border:none; padding:10px 12px; border-radius:8px; font-weight:700; cursor:pointer;">Add Unavailable Variant</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('addVariantBtn').addEventListener('click', function() {
        const color = document.getElementById('variantColorSelect').value || null;
        const size = document.getElementById('variantSizeSelect').value || null;
        if (!color && !size) {
            alert('Please choose a color or size (or both) to mark as unavailable.');
            return;
        }
        addUnavailableVariant(itemId, color, size);
    });
}

function closeManageAvailabilityModal() { const m = document.getElementById('manageAvailabilityModal'); if (m) m.remove(); }

function addUnavailableVariant(itemId, color, size) {
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    const idx = menuItems.findIndex(i => i.id === itemId);
    if (idx === -1) return;
    const item = menuItems[idx];
    item.unavailableVariants = item.unavailableVariants || [];

    // Prevent duplicate entries
    const exists = item.unavailableVariants.some(v => (v.color === color) && (v.size === size));
    if (exists) {
        showAlert('error', 'This variant is already marked unavailable.');
        return;
    }

    item.unavailableVariants.push({ color: color || null, size: size || null });
    localStorage.setItem('menuItems', JSON.stringify(menuItems));
    showAlert('success', 'Variant marked unavailable.');
    closeManageAvailabilityModal();
    loadMenuItems();
    loadViewMenuItems();
}

function removeUnavailableVariant(itemId, variantIndex) {
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    const idx = menuItems.findIndex(i => i.id === itemId);
    if (idx === -1) return;
    const item = menuItems[idx];
    item.unavailableVariants = item.unavailableVariants || [];
    item.unavailableVariants.splice(variantIndex, 1);
    localStorage.setItem('menuItems', JSON.stringify(menuItems));
    showAlert('success', 'Variant availability restored.');
    closeManageAvailabilityModal();
    loadMenuItems();
    loadViewMenuItems();
}

function toggleWholeAvailability(itemId) {
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    const idx = menuItems.findIndex(i => i.id === itemId);
    if (idx === -1) return;
    menuItems[idx].available = !menuItems[idx].available;
    localStorage.setItem('menuItems', JSON.stringify(menuItems));
    showAlert('success', `Menu item ${menuItems[idx].available ? 'enabled' : 'disabled'} successfully!`);
    closeManageAvailabilityModal();
    loadMenuItems();
    loadViewMenuItems();
}

function cancelOrder(orderId) {
    const currentStaff = JSON.parse(localStorage.getItem('currentStaff')) || {};
    if (currentStaff.role !== 'admin') {
        showAlert('error', 'Access denied! Only administrators can cancel orders.');
        return;
    }

    if (!confirm(`Are you sure you want to cancel Order #${orderId}?`)) {
        return;
    }

    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) {
        showAlert('error', 'Order not found.');
        return;
    }

    orders[idx].status = 'Cancelled';
    localStorage.setItem('orders', JSON.stringify(orders));

    showAlert('success', `Order #${orderId} has been cancelled.`);
    // Persist a cancelled-order record so customers can see cancellations
    try {
        const cancelled = JSON.parse(localStorage.getItem('cancelledOrders')) || [];
        // Try to associate to a user via explicit fields on the order, fallback to name-matching
        let userEmail = orders[idx].customerEmail || null;
        let userName = orders[idx].customerName || (orders[idx].address && orders[idx].address.name ? orders[idx].address.name : null);
        if (!userEmail && userName) {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const matched = users.find(u => (u.name && userName && (u.name === userName || u.name.toLowerCase() === userName.toLowerCase())));
            if (matched) userEmail = matched.email;
        }

        cancelled.push({
            id: orders[idx].id,
            date: new Date().toISOString(),
            cancelledBy: 'admin',
            userEmail: userEmail,
            userName: userName,
            orderSnapshot: orders[idx]
        });
        localStorage.setItem('cancelledOrders', JSON.stringify(cancelled));
        try { localStorage.setItem('orders_updated', String(Date.now())); } catch (e) { /* ignore */ }
    } catch (e) {
        console.warn('Failed to persist cancelled order record', e);
    }

    loadAllOrders();
    loadDashboardStats();
    loadRecentOrders();
}
