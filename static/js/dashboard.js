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
    }
    
    // Initialize dashboard
    // Normalize any legacy orders so payment fields display correctly in admin/staff views
    normalizeOrdersForDashboard();
    loadDashboardStats();
    loadRecentOrders();
    
    // Setup dropdown click handler
    setupDropdownHandler();
    
    // Setup mobile menu toggle for dashboard
    setupMobileMenuToggle();
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
    document.getElementById('dashboardContent').style.display = 'block';
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
                const nameToId = { 'GCash': 'gcash', 'Maya': 'maya', 'PayPal': 'paypal' };
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
                        const nameToId = { 'GCash': 'gcash', 'Maya': 'maya', 'PayPal': 'paypal' };
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
    if (norm.includes('gcash')) return 'GCash';
    if (norm.includes('paymaya') || norm.includes('maya')) return 'Maya';
    if (norm.includes('paypal')) return 'PayPal';

    // Final direct checks (in case a friendly name exists but didn't include tokens)
    const direct = (asString(order.paymentMethodName) || asString(order.paymentMethod) || asString(order.paymentMethodId) || '').trim().toLowerCase();
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
    const methodMap = { gcash: 'GCash', maya: 'Maya', paypal: 'PayPal' };
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
                        <button onclick="deleteOrder(${order.id})" class="action-btn" style="
                            padding: 8px 12px;
                            border-radius: 8px;
                            border: 1px solid rgba(239, 68, 68, 0.4);
                            background: rgba(239, 68, 68, 0.2);
                            color: #ef4444;
                            font-weight: 600;
                            cursor: pointer;
                            outline: none;
                            margin-left: 8px;
                        ">
                            <ion-icon name="trash-outline" style="vertical-align: middle;"></ion-icon>
                            Delete
                        </button>
                        ` : ''}
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
        case 'Shipping': return '#3b82f6';
        case 'Delivered': return '#22c55e';
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
                <h3 style="color: rgba(255,255,255,0.8); margin-bottom: 10px;">No Menu Items</h3>
                <p>No menu items available at the moment.</p>
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
                <h3 style="color: rgba(255,255,255,0.8); margin-bottom: 10px;">No Menu Items</h3>
                <p>Start by adding your first menu item.</p>
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
                    <h2>Add New Menu Item</h2>
                    <button onclick="closeMenuItemModal()" class="close-btn">
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>
                <form onsubmit="saveMenuItem(event)">
                    <div class="form-group">
                        <label>Item Name *</label>
                        <input type="text" id="itemName" required>
                    </div>
                    <div class="form-group">
                        <label>Price (₱) *</label>
                        <input type="number" id="itemPrice" step="0.01" min="0" required>
                    </div>
                    <div class="form-group">
                        <label>Category *</label>
                        <select id="itemCategory" required>
                            <option value="">Select category</option>
                            <option value="Steamed">Steamed Dishes</option>
                            <option value="Fried">Fried Dishes</option>
                            <option value="Baked">Baked Dishes</option>
                            <option value="Noodles">Noodles</option>
                            <option value="Special">Special Dishes</option>
                            <option value="Dessert">Dessert</option>
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
                    <button type="submit" class="submit-btn">Add Menu Item</button>
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
                    <h2>Edit Menu Item</h2>
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
                            <option value="Steamed" ${item.category === 'Steamed' ? 'selected' : ''}>Steamed Dishes</option>
                            <option value="Fried" ${item.category === 'Fried' ? 'selected' : ''}>Fried Dishes</option>
                            <option value="Baked" ${item.category === 'Baked' ? 'selected' : ''}>Baked Dishes</option>
                            <option value="Noodles" ${item.category === 'Noodles' ? 'selected' : ''}>Noodles</option>
                            <option value="Special" ${item.category === 'Special' ? 'selected' : ''}>Special Dishes</option>
                            <option value="Dessert" ${item.category === 'Dessert' ? 'selected' : ''}>Dessert</option>
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
                    <button type="submit" class="submit-btn">Update Menu Item</button>
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
                    <div class="form-group">
                        <label>Role *</label>
                        <select id="staffRole" required>
                            <option value="">Select role</option>
                            <option value="staff">Staff</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>
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
        role: document.getElementById('staffRole').value,
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