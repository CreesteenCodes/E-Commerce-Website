// ============================================
// RESPONSIVE MENU TOGGLE
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    
    // Toggle menu on click
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            navLinks.classList.toggle('active');
            
            // Toggle icon between menu and close
            const icon = menuToggle.querySelector('ion-icon');
            if (navLinks.classList.contains('active')) {
                icon.setAttribute('name', 'close-outline');
            } else {
                icon.setAttribute('name', 'menu-outline');
            }
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (navLinks && navLinks.classList.contains('active')) {
            const isClickInsideNav = navLinks.contains(event.target);
            const isClickOnToggle = menuToggle && menuToggle.contains(event.target);
            
            if (!isClickInsideNav && !isClickOnToggle) {
                navLinks.classList.remove('active');
                const icon = menuToggle.querySelector('ion-icon');
                if (icon) icon.setAttribute('name', 'menu-outline');
            }
        }
    });
    
    // Close mobile menu when clicking on a link
    if (navLinks) {
        const navLinksItems = navLinks.querySelectorAll('a:not(.dropdown-toggle)');
        navLinksItems.forEach(link => {
            link.addEventListener('click', (e) => {
                // Don't close navbar if clicking inside dropdown menus
                if (link.closest('.dropdown-menu') || link.closest('.dropdown')) {
                    return;
                }
                
                if (window.innerWidth <= 768) {
                    navLinks.classList.remove('active');
                    const icon = menuToggle.querySelector('ion-icon');
                    if (icon) icon.setAttribute('name', 'menu-outline');
                }
            });
        });
    }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href !== '#top') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// ============================================
// HERO SECTION - ORDER NOW BUTTON
// ============================================

// Helper function to get correct path based on current location
function getCorrectPath(filename) {
    // Check if we're in the templates folder or root
    const isInTemplates = window.location.pathname.includes('/templates/');
    if (isInTemplates) {
        // We're in templates folder, need to go up one level
        if (filename === 'index.html' || filename === 'admin_staff.html') {
            return '../' + filename;
        }
        return filename; // For files in templates folder
    } else {
        // We're in root folder
        if (filename === 'index.html' || filename === 'admin_staff.html') {
            return filename; // Files in root
        }
        return 'templates/' + filename; // Files in templates folder
    }
}

// Format numbers as PHP currency with thousand separators and two decimals
function formatCurrency(n) {
    const num = parseFloat(String(n).replace(/[^0-9.-]+/g, '')) || 0;
    return num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Order Now button functionality
document.addEventListener('DOMContentLoaded', function() {
    const orderBtn = document.querySelector('.order-btn');
    if (orderBtn) {
        orderBtn.addEventListener('click', function() {
            const isLoggedIn = localStorage.getItem('isLoggedIn');
            if (isLoggedIn === 'true') {
                // Scroll to menu section
                const menuSection = document.querySelector('.menu-section');
                if (menuSection) {
                    menuSection.scrollIntoView({ behavior: 'smooth' });
                } else {
                    // If not on homepage, redirect to menu page
                    window.location.href = getCorrectPath('menu.html') + '#menu';
                }
            } else {
                showAlert('error', 'Please login to place an order!');
                setTimeout(() => {
                    window.location.href = getCorrectPath('login.html');
                }, 1500);
            }
        });
    }
});

// ============================================
// AUTHENTICATION SYSTEM
// ============================================

// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    initializeCart();
    normalizeExistingOrders();
    
    // Enable menu dropdown (not account) to open on click for mobile/desktop
    document.querySelectorAll('.dropdown:not(.account-dropdown) > .dropdown-toggle').forEach(function(toggle) {
        // Allow link to work normally (navigate to menu.html) but also toggle dropdown
        toggle.addEventListener('click', function(e) {
            const parent = this.parentElement;
            
            // On mobile (<=768px), always prevent default and toggle dropdown
            if (window.innerWidth <= 768) {
                e.preventDefault();
                e.stopPropagation();
                
                // Close other menu dropdowns first
                document.querySelectorAll('.dropdown.open:not(.account-dropdown)').forEach(function(drop) {
                    if (drop !== parent) {
                        drop.classList.remove('open');
                    }
                });
                
                // Toggle this dropdown
                parent.classList.toggle('open');
            }
            // On desktop, only toggle if clicking chevron icon
            else if (e.target.tagName === 'ION-ICON' || e.target.closest('ion-icon')) {
                e.preventDefault();
                e.stopPropagation();
                
                // Close other menu dropdowns first
                document.querySelectorAll('.dropdown.open:not(.account-dropdown)').forEach(function(drop) {
                    if (drop !== parent) {
                        drop.classList.remove('open');
                    }
                });
                
                // Toggle this dropdown
                parent.classList.toggle('open');
            }
            // On desktop, clicking the link text navigates to menu.html (default behavior)
        });
    });
    
    // Close menu dropdown when clicking outside (both mobile and desktop)
    document.addEventListener('click', function(e) {
        const isDropdownClick = e.target.closest('.dropdown:not(.account-dropdown)');
        if (!isDropdownClick) {
            document.querySelectorAll('.dropdown.open:not(.account-dropdown)').forEach(function(drop) {
                drop.classList.remove('open');
            });
        }
    });
});

function checkAuthStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const currentUser = localStorage.getItem('currentUser');
    
    // Update navigation based on login status
    // Find all login links regardless of their href pattern
    const loginLinks = document.querySelectorAll('a[href*="login.html"]');
    loginLinks.forEach(link => {
        if (link.textContent.trim() === 'Login' && isLoggedIn === 'true') {
            const userName = currentUser ? JSON.parse(currentUser).name.split(' ')[0] : 'Account';

            // Build a dedicated wrapper for the account dropdown so only the account area triggers it
            const accountWrapper = document.createElement('div');
            accountWrapper.className = 'dropdown account-dropdown';

            // Prepare the existing link to act as the dropdown toggle
            link.textContent = userName;
            link.href = '#';
            link.classList.add('dropdown-toggle');
            link.onclick = function(e) {
                e.preventDefault();
                // Toggle .open class for dropdown on click (mobile/desktop)
                accountWrapper.classList.toggle('open');
            };

            // Add dropdown chevron icon
            const icon = document.createElement('ion-icon');
            icon.name = 'chevron-down-outline';
            icon.style.marginLeft = '5px';
            link.appendChild(icon);

            // Create dropdown menu
            const dropdownMenu = document.createElement('div');
            dropdownMenu.className = 'dropdown-menu';
            dropdownMenu.innerHTML = `
                <a href="#" onclick="showAccountDetails(); return false;">
                    <ion-icon name="person-outline" style="margin-right: 8px; vertical-align: middle;"></ion-icon>
                    Account Details
                </a>
                <a href="#" onclick="showOrderStatus(); return false;">
                    <ion-icon name="receipt-outline" style="margin-right: 8px; vertical-align: middle;"></ion-icon>
                    Order Status
                </a>
                <a href="#" onclick="showPurchaseHistory(); return false;">
                    <ion-icon name="bag-check-outline" style="margin-right: 8px; vertical-align: middle;"></ion-icon>
                    Purchase History
                </a>
                <a href="#" onclick="handleLogout(); return false;" style="color: #ef4444;">
                    <ion-icon name="log-out-outline" style="margin-right: 8px; vertical-align: middle;"></ion-icon>
                    Logout
                </a>
            `;

            // Replace the original link with the new wrapper that contains the link and menu
            const parent = link.parentElement;
            parent.replaceChild(accountWrapper, link);
            accountWrapper.appendChild(link);
            accountWrapper.appendChild(dropdownMenu);

            // Close dropdown when clicking outside the wrapper
            document.addEventListener('click', function handleDropdownClose(event) {
                if (!accountWrapper.contains(event.target)) {
                    accountWrapper.classList.remove('open');
                }
            });
        }
    });
    
    // Protect order functionality
    const addBtns = document.querySelectorAll('.add-btn');
    addBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (isLoggedIn !== 'true') {
                e.preventDefault();
                showAlert('error', 'Please login or sign up to place an order!');
                setTimeout(() => {
                    window.location.href = getCorrectPath('login.html');
                }, 1500);
                return;
            }

            // Get item details
            const card = this.closest('.menu-card');
            const itemName = card.querySelector('h3').textContent;
            const itemPrice = card.querySelector('.price').textContent;
            const itemImage = card.querySelector('img').src;

            // Block if item is unavailable (synced from admin dashboard)
            if (!isMenuItemAvailableByName(itemName)) {
                e.preventDefault();
                showAlert('error', 'Sorry, this item is currently unavailable.');
                // Refresh UI to reflect disabled state just in case
                applyAvailabilityUI();
                return;
            }

            // Show variant picker modal (requires color and size)
            showVariantPicker({ name: itemName, price: itemPrice, image: itemImage }, function(selected) {
                if (!selected) {
                    // User cancelled
                    return;
                }

                // Build cart item including selected color/size
                const cartItem = {
                    name: itemName,
                    price: itemPrice,
                    image: itemImage,
                    color: selected.color,
                    size: selected.size,
                    quantity: 1
                };

                addToCart(cartItem);
                showAlert('success', `${itemName} (${selected.color}, ${selected.size}) added to cart!`);
            });
        });
    });
    
    // Protect cart functionality
    const cartIcon = document.querySelector('.icons ion-icon[name="cart-outline"]');
    if (cartIcon) {
        cartIcon.parentElement.style.cursor = 'pointer';
        cartIcon.parentElement.addEventListener('click', function() {
            if (isLoggedIn !== 'true') {
                showAlert('error', 'Please login to view your cart!');
                setTimeout(() => {
                    window.location.href = getCorrectPath('login.html');
                }, 1500);
            } else {
                viewCart();
            }
        });
        
        // Update cart badge
        updateCartBadge();
    }
}

// Toggle between login and signup forms
function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm && signupForm) {
        loginForm.classList.toggle('hidden');
        signupForm.classList.toggle('hidden');
        
        // Clear any existing alerts
        const existingAlerts = document.querySelectorAll('.alert-message');
        existingAlerts.forEach(alert => alert.remove());
    }
}

// Handle Login
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Get stored users
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Find user
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        // Login successful
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', JSON.stringify({
            name: user.name,
            email: user.email
        }));
        
        if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
        }
        
        showAlert('success', 'Login successful! Redirecting...');
        
        setTimeout(() => {
            window.location.href = getCorrectPath('index.html');
        }, 1500);
    } else {
        showAlert('error', 'Invalid email or password!');
    }
    
    return false;
}

// Handle Signup
function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    // Validation
    if (password !== confirmPassword) {
        showAlert('error', 'Passwords do not match!');
        return false;
    }
    
    if (password.length < 6) {
        showAlert('error', 'Password must be at least 6 characters!');
        return false;
    }
    
    // Get existing users
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Check if email already exists
    if (users.some(u => u.email === email)) {
        showAlert('error', 'Email already registered!');
        return false;
    }
    
    // Create new user
    const newUser = {
        name: name,
        email: email,
        password: password,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Auto login after signup
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUser', JSON.stringify({
        name: newUser.name,
        email: newUser.email
    }));
    
    showAlert('success', 'Account created successfully! Redirecting...');
    
    setTimeout(() => {
    window.location.href = getCorrectPath('index.html');
    }, 1500);
    
    return false;
}

// Show Account Details
function showAccountDetails() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        showAlert('error', 'Please login to view account details!');
        return;
    }
    
    const accountHTML = `
        <div class="shipping-address-form" style="color: white; backdrop-filter: blur(20px);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #f8af1e;">
                <h2 style="
                    color: #f8af1e; 
                    margin: 0;
                    font-size: 2rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <ion-icon name="person-outline" style="font-size: 2rem;"></ion-icon>
                    Account Details
                </h2>
                <button onclick="closeAccountModal()" style="
                    background: transparent;
                    border: none;
                    color: #f8af1e;
                    font-size: 2rem;
                    cursor: pointer;
                    padding: 0;
                    width: 35px;
                    height: 35px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
                    <ion-icon name="close-outline"></ion-icon>
                </button>
            </div>
            
            <div style="background: rgba(255, 255, 255, 0.05); padding: 25px; border-radius: 12px; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 25px;">
                    <div style="
                        width: 80px;
                        height: 80px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #f8af1e, #e48a0a);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 2.5rem;
                        font-weight: 700;
                        color: #000;
                    ">
                        ${currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 style="color: white; margin: 0 0 5px 0; font-size: 1.5rem;">${currentUser.name}</h3>
                        <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 0.95rem;">Member</p>
                    </div>
                </div>
                
                <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
                    <div style="margin-bottom: 15px;">
                        <label style="color: rgba(255,255,255,0.6); font-size: 0.85rem; display: block; margin-bottom: 5px;">Full Name</label>
                        <p style="color: white; margin: 0; font-size: 1.1rem; font-weight: 500;">${currentUser.name}</p>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="color: rgba(255,255,255,0.6); font-size: 0.85rem; display: block; margin-bottom: 5px;">Email Address</label>
                        <p style="color: white; margin: 0; font-size: 1.1rem; font-weight: 500;">${currentUser.email}</p>
                    </div>
                </div>
            </div>
            
            <div style="display:flex; gap:10px;">
                <button onclick="showPurchaseHistory()" style="
                    background: transparent;
                    color: #f8af1e;
                    border: 1px solid #f8af1e;
                    padding: 12px 18px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-weight: 700;
                    font-size: 0.95rem;
                    flex:1;
                " onmouseover="this.style.background='#f8af1e'; this.style.color='#000'" onmouseout="this.style.background='transparent'; this.style.color='#f8af1e'">Purchase History</button>

                <button onclick="closeAccountModal()" style="
                    background: #f8af1e;
                    color: #000;
                    border: none;
                    padding: 12px 18px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-weight: 700;
                    font-size: 0.95rem;
                    flex:1;
                " onmouseover="this.style.background='#e48a0a'" onmouseout="this.style.background='#f8af1e'">
                    Close
                </button>
            </div>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.id = 'accountModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.92);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow-y: auto;
        padding: 20px 0;
    `;
    modal.innerHTML = accountHTML;
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeAccountModal();
        }
    });
    
    document.body.appendChild(modal);
}

function closeAccountModal() {
    const modal = document.getElementById('accountModal');
    if (modal) {
        modal.remove();
    }
}

// Show Order Status
function showOrderStatus() {
    const allOrders = JSON.parse(localStorage.getItem('orders')) || [];
    
    // Filter out orders that customer has already confirmed as received
    const orders = allOrders.filter(order => !order.confirmedReceived);
    
    let orderHTML = `
        <div class="shipping-address-form" style="color: white; backdrop-filter: blur(20px); max-height: 90vh; display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #f8af1e;">
                <h2 style="
                    color: #f8af1e; 
                    margin: 0;
                    font-size: 2rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <ion-icon name="receipt-outline" style="font-size: 2rem;"></ion-icon>
                    Order Status
                </h2>
                <button onclick="closeOrderStatusModal()" style="
                    background: transparent;
                    border: none;
                    color: #f8af1e;
                    font-size: 2rem;
                    cursor: pointer;
                    padding: 0;
                    width: 35px;
                    height: 35px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
                    <ion-icon name="close-outline"></ion-icon>
                </button>
            </div>
    `;
    
    if (orders.length === 0) {
        orderHTML += `
            <div style="text-align: center; padding: 60px 20px;">
                <ion-icon name="receipt-outline" style="
                    font-size: 5rem;
                    color: rgba(248, 175, 30, 0.3);
                    margin-bottom: 20px;
                "></ion-icon>
                <h3 style="color: rgba(255, 255, 255, 0.8); font-size: 1.5rem; margin-bottom: 10px;">
                    No Orders Yet
                </h3>
                <p style="color: rgba(255, 255, 255, 0.5); margin-bottom: 30px; font-size: 1rem;">
                    You haven't placed any orders yet. Start ordering now!
                </p>
                <button onclick="closeOrderStatusModal()" style="
                    background: #f8af1e; 
                    color: #000; 
                    border: none; 
                    padding: 15px 30px; 
                    border-radius: 10px; 
                    font-weight: 700; 
                    cursor: pointer;
                    font-size: 1rem;
                " onmouseover="this.style.background='#e48a0a'" onmouseout="this.style.background='#f8af1e'">
                    Browse Products
                </button>
            </div>
        `;
    } else {
        orderHTML += `<div style="flex: 1; overflow-y: auto; padding-right: 8px; margin-right: -8px;">`;
        
        orders.reverse().forEach((order, index) => {
            const orderDate = new Date(order.date);
            const statusColor = order.status === 'Delivered' ? '#22c55e' : 
                               order.status === 'Shipping' ? '#3b82f6' : '#f8af1e';
            // Determine payment method display (use helper)
            const methodIconMap = { gcash: 'wallet-outline', maya: 'phone-portrait-outline', paypal: 'logo-paypal' };
            const methodId = order.paymentMethodId || null;
            const methodLabel = resolvePaymentLabel(order);
            const methodIcon = methodIconMap[methodId] || 'card-outline';
            
            orderHTML += `
                <div style="
                    background: rgba(255, 255, 255, 0.05);
                    padding: 20px;
                    border-radius: 12px;
                    margin-bottom: 15px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                ">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                        <div>
                            <p style="color: rgba(255,255,255,0.6); margin: 0 0 5px 0; font-size: 0.85rem;">Order #${order.id}</p>
                            <p style="color: white; margin: 0; font-size: 1.1rem; font-weight: 600;">₱${formatCurrency(order.total)}</p>
                        </div>
                        <span style="
                            background: ${statusColor}20;
                            color: ${statusColor};
                            padding: 6px 12px;
                            border-radius: 20px;
                            font-size: 0.85rem;
                            font-weight: 600;
                            border: 1px solid ${statusColor}40;
                        ">
                            ${order.status}
                        </span>
                    </div>
                    
                    <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
                        <p style="color: rgba(255,255,255,0.7); margin: 5px 0; font-size: 0.9rem;">
                            <ion-icon name="calendar-outline" style="vertical-align: middle;"></ion-icon>
                            ${orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <p style="color: rgba(255,255,255,0.7); margin: 5px 0; font-size: 0.9rem; display: flex; align-items: center; gap: 6px;">
                            <ion-icon name="${methodIcon}" style="vertical-align: middle;"></ion-icon>
                            ${methodLabel}
                        </p>
                        <p style="color: rgba(255,255,255,0.7); margin: 5px 0; font-size: 0.9rem;">
                            <ion-icon name="location-outline" style="vertical-align: middle;"></ion-icon>
                            ${order.address.city}, ${order.address.state}
                        </p>
                    </div>
                    ${order.status === 'Delivered' ? `<div style="display:flex; gap:10px; margin-top:12px;">
                        <button onclick="confirmReceived(${order.id})" style="background:#22c55e;color:#000;border:none;padding:8px 12px;border-radius:8px;font-weight:700;cursor:pointer;">Confirm Received</button>
                        <button onclick="showOrderItemsCustomer(${order.id})" style="background:transparent;color:#f8af1e;border:1px solid #f8af1e;padding:8px 12px;border-radius:8px;font-weight:700;cursor:pointer;">View Items</button>
                    </div>` : `<div style="display:flex; gap:10px; margin-top:12px;">
                        <button onclick="showOrderItemsCustomer(${order.id})" style="background:transparent;color:#f8af1e;border:1px solid #f8af1e;padding:8px 12px;border-radius:8px;font-weight:700;cursor:pointer;">View Items</button>
                    </div>`}
                </div>
            `;
        });
        
        orderHTML += `</div>`;
    }
    
    orderHTML += `
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.id = 'orderStatusModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.92);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow-y: auto;
        padding: 20px 0;
    `;
    modal.innerHTML = orderHTML;
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeOrderStatusModal();
        }
    });
    
    document.body.appendChild(modal);
}

function closeOrderStatusModal() {
    const modal = document.getElementById('orderStatusModal');
    if (modal) {
        modal.remove();
    }
}

// Customer: show ordered items for a specific order
function showOrderItemsCustomer(orderId) {
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
                <button onclick="closeOrderItemsModalCustomer()" style="background:transparent; border:none; color:#f8af1e; font-size:1.6rem; cursor:pointer;"><ion-icon name="close-outline"></ion-icon></button>
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
    const shippingFee = (typeof order.shippingFee === 'number') ? order.shippingFee : getShippingFee();
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
                <button onclick="closeOrderItemsModalCustomer()" style="background:#f8af1e; color:#000; border:none; padding:10px 14px; border-radius:8px; font-weight:700; cursor:pointer;">Close</button>
            </div>
        </div>
    `;

    const modal = document.createElement('div');
    modal.id = 'orderItemsModalCustomer';
    modal.style.cssText = `position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.92); z-index:10000; display:flex; align-items:center; justify-content:center; overflow-y:auto; padding:20px 0;`;
    modal.innerHTML = html;
    modal.addEventListener('click', function(e) { if (e.target === modal) closeOrderItemsModalCustomer(); });
    document.body.appendChild(modal);
}

function closeOrderItemsModalCustomer() { const m = document.getElementById('orderItemsModalCustomer'); if (m) m.remove(); }

// Handle Logout
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('rememberMe');
        
        showAlert('success', 'Logged out successfully!');
        
        setTimeout(() => {
            window.location.href = getCorrectPath('index.html');
        }, 1000);
    }
}

// ============================================
// CART FUNCTIONALITY
// ============================================

function initializeCart() {
    if (!localStorage.getItem('cart')) {
        localStorage.setItem('cart', JSON.stringify([]));
    }
}

function addToCart(item) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Check if an identical item (same name + variant) already exists in cart
    // Compare name + color + size when available to avoid merging different variants
    const existingItem = cart.find(cartItem => {
        const sameName = cartItem.name === item.name;
        const sameColor = (cartItem.color || null) === (item.color || null);
        const sameSize = (cartItem.size || null) === (item.size || null);
        return sameName && sameColor && sameSize;
    });

    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        item.quantity = item.quantity || 1;
        cart.push(item);
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
}

// Variant picker modal: requires color and size selection before adding to cart
function showVariantPicker(item, callback) {
    const colors = ['Beige', 'Black', 'Blue', 'Sage', 'White'];
    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

    // If modal already exists, don't create another
    if (document.getElementById('variantModal')) return;

    // Read admin-configured unavailable variants for this item (if any)
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    const foundItem = menuItems.find(i => (i.name || '').toLowerCase() === (item.name || '').toLowerCase());
    const unavailableRules = (foundItem && Array.isArray(foundItem.unavailableVariants)) ? foundItem.unavailableVariants : [];

    // Build quick lookup maps for disabled rules
    const colorOnly = new Set(); // colors disabled entirely
    const sizeOnly = new Set();  // sizes disabled entirely
    const colorSizeMap = {}; // color -> Set(sizes) disabled for that color
    const sizeColorMap = {}; // size -> Set(colors) disabled for that size

    unavailableRules.forEach(r => {
        const c = r.color || null;
        const s = r.size || null;
        if (c && s) {
            colorSizeMap[c] = colorSizeMap[c] || new Set();
            colorSizeMap[c].add(s);
            sizeColorMap[s] = sizeColorMap[s] || new Set();
            sizeColorMap[s].add(c);
        } else if (c && !s) {
            colorOnly.add(c);
        } else if (!c && s) {
            sizeOnly.add(s);
        }
    });

    const modal = document.createElement('div');
    modal.id = 'variantModal';
    modal.style.cssText = 'position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.8); z-index:10001; display:flex; align-items:center; justify-content:center; padding:20px;';

    // Generate buttons, marking unavailable ones visually (disabled) and adding informative title tooltips
    let colorButtons = colors.map(c => {
        const disabledAll = colorOnly.has(c) || (colorSizeMap[c] && colorSizeMap[c].size === sizes.length);
        const partial = (colorSizeMap[c] && colorSizeMap[c].size > 0) && !disabledAll;
        const titleParts = [];
        if (disabledAll) titleParts.push('All sizes unavailable');
        else if (partial) titleParts.push('Unavailable sizes: ' + Array.from(colorSizeMap[c]).join(', '));
        if (colorOnly.has(c)) titleParts.unshift('Color disabled');
        const titleAttr = titleParts.length ? `title="${titleParts.join(' · ')}"` : '';
        const disabledAttr = disabledAll ? 'disabled' : '';
        const style = disabledAll ? 'padding:8px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.06); background: rgba(239,68,68,0.08); color:#ef4444; cursor:not-allowed; opacity:0.6;' : 'padding:8px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.08); background:transparent; color:white; cursor:pointer;';
        return `<button type="button" class="variant-color" data-color="${c}" ${disabledAttr} ${titleAttr} style="${style}">${c}</button>`;
    }).join('');

    let sizeButtons = sizes.map(s => {
        const disabledAll = sizeOnly.has(s) || (sizeColorMap[s] && sizeColorMap[s].size === colors.length);
        const partial = (sizeColorMap[s] && sizeColorMap[s].size > 0) && !disabledAll;
        const titleParts = [];
        if (disabledAll) titleParts.push('All colors unavailable');
        else if (partial) titleParts.push('Unavailable colors: ' + Array.from(sizeColorMap[s]).join(', '));
        if (sizeOnly.has(s)) titleParts.unshift('Size disabled');
        const titleAttr = titleParts.length ? `title="${titleParts.join(' · ')}"` : '';
        const disabledAttr = disabledAll ? 'disabled' : '';
        const style = disabledAll ? 'padding:8px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.06); background: rgba(239,68,68,0.08); color:#ef4444; cursor:not-allowed; opacity:0.6;' : 'padding:8px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.08); background:transparent; color:white; cursor:pointer;';
        return `<button type="button" class="variant-size" data-size="${s}" ${disabledAttr} ${titleAttr} style="${style}">${s}</button>`;
    }).join('');

    modal.innerHTML = `
        <div style="max-width:540px; width:100%; background: rgba(11,15,19,0.98); padding:22px; border-radius:12px; border:1px solid rgba(255,255,255,0.06);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <h3 style="color:#f8af1e; margin:0; font-size:1.2rem;">Choose Color & Size</h3>
                <button id="variantCancel" style="background:transparent; border:none; color:#f8af1e; font-size:1.2rem; cursor:pointer;"><ion-icon name="close-outline"></ion-icon></button>
            </div>
            <div style="display:flex; gap:12px; align-items:center; margin-bottom:12px;">
                <img src="${item.image}" alt="${item.name}" style="width:72px; height:72px; object-fit:cover; border-radius:8px;">
                <div style="min-width:0;">
                    <div style="color:white; font-weight:700;">${item.name}</div>
                    <div style="color:rgba(255,255,255,0.7);">${formatCurrency(item.price)}</div>
                </div>
            </div>
            <div style="margin-bottom:12px;">
                <label style="color:rgba(255,255,255,0.85); display:block; margin-bottom:8px; font-weight:600;">Color</label>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">${colorButtons}</div>
            </div>
            <div style="margin-bottom:18px;">
                <label style="color:rgba(255,255,255,0.85); display:block; margin-bottom:8px; font-weight:600;">Size</label>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">${sizeButtons}</div>
            </div>
            <div style="display:flex; gap:10px;">
                <button id="variantConfirm" disabled style="flex:1; background:#f8af1e; color:#000; border:none; padding:12px 14px; border-radius:8px; font-weight:700; cursor:not-allowed; opacity:0.5;">Add to Cart</button>
                <button id="variantCancel2" style="flex:1; background:transparent; color:white; border:1px solid rgba(255,255,255,0.12); padding:12px 14px; border-radius:8px; font-weight:600; cursor:pointer;">Cancel</button>
            </div>
        </div>
    `;

    // Append and wire up
    document.body.appendChild(modal);

    let selectedColor = null;
    let selectedSize = null;

    // Helper to (re)compute UI state for sizes/colors when selection changes
    function refreshOptionStates() {
        // When a color is selected, disable sizes that are unavailable for that color
        modal.querySelectorAll('.variant-size').forEach(sb => {
            const s = sb.getAttribute('data-size');
            let disabled = false;
            // Global size-only rule
            if (sizeOnly.has(s)) disabled = true;
            // If a color is selected, check color+size pair
            if (selectedColor) {
                // If a pair rule exists (colorSizeMap[selectedColor] contains s)
                if (colorSizeMap[selectedColor] && colorSizeMap[selectedColor].has(s)) disabled = true;
            }
            // If no color selected, the button may still be disabled from global rules; leave it as is
            if (disabled) {
                sb.setAttribute('disabled', '');
                sb.style.background = 'rgba(239,68,68,0.08)';
                sb.style.color = '#ef4444';
                sb.style.cursor = 'not-allowed';
                sb.style.opacity = '0.6';
            } else {
                sb.removeAttribute('disabled');
                // Preserve selected style if this size is currently selected
                if (selectedSize === s) {
                    sb.style.background = '#f8af1e';
                    sb.style.color = '#000';
                    sb.style.cursor = 'pointer';
                    sb.style.opacity = '1';
                } else {
                    sb.style.background = 'transparent';
                    sb.style.color = 'white';
                    sb.style.cursor = 'pointer';
                    sb.style.opacity = '1';
                }
            }
        });

        // When a size is selected, disable colors that are unavailable for that size
        modal.querySelectorAll('.variant-color').forEach(cb => {
            const c = cb.getAttribute('data-color');
            let disabled = false;
            if (colorOnly.has(c)) disabled = true;
            if (selectedSize) {
                if (sizeColorMap[selectedSize] && sizeColorMap[selectedSize].has(c)) disabled = true;
            }
            if (disabled) {
                cb.setAttribute('disabled', '');
                cb.style.background = 'rgba(239,68,68,0.08)';
                cb.style.color = '#ef4444';
                cb.style.cursor = 'not-allowed';
                cb.style.opacity = '0.6';
            } else {
                cb.removeAttribute('disabled');
                // Preserve selected style if this color is currently selected
                if (selectedColor === c) {
                    cb.style.background = '#f8af1e';
                    cb.style.color = '#000';
                    cb.style.cursor = 'pointer';
                    cb.style.opacity = '1';
                } else {
                    cb.style.background = 'transparent';
                    cb.style.color = 'white';
                    cb.style.cursor = 'pointer';
                    cb.style.opacity = '1';
                }
            }
        });

        updateConfirmState();
    }

    function updateConfirmState() {
        const btn = document.getElementById('variantConfirm');
        if (selectedColor && selectedSize) {
            // Check variant-level availability (if admin disabled specific variants)
            const available = isMenuItemAvailableByName(item.name, selectedColor, selectedSize);
            if (available) {
                btn.disabled = false;
                btn.style.pointerEvents = 'auto';
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                btn.textContent = 'Add to Cart';
                btn.style.background = '#f8af1e';
                btn.style.color = '#000';
            } else {
                btn.disabled = true;
                btn.style.pointerEvents = 'none';
                btn.style.opacity = '0.6';
                btn.style.cursor = 'not-allowed';
                btn.textContent = 'Variant Unavailable';
                btn.style.background = 'rgba(239,68,68,0.2)';
                btn.style.color = '#ef4444';
            }
        } else {
            btn.disabled = true;
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.textContent = 'Add to Cart';
            btn.style.background = '#f8af1e';
            btn.style.color = '#000';
        }
    }

    // Color buttons
    modal.querySelectorAll('.variant-color').forEach(b => {
        b.addEventListener('click', function() {
            if (this.hasAttribute('disabled')) return; // ignore clicks on disabled
            const thisColor = this.getAttribute('data-color');
            // Toggle selection
            if (selectedColor === thisColor) {
                selectedColor = null;
            } else {
                selectedColor = thisColor;
            }

            // Visual selection styling
            modal.querySelectorAll('.variant-color').forEach(x => {
                if (x.getAttribute('data-color') === selectedColor) {
                    x.style.background = '#f8af1e';
                    x.style.color = '#000';
                } else {
                    // keep disabled look if disabled
                    if (x.hasAttribute('disabled')) {
                        x.style.background = 'rgba(239,68,68,0.08)';
                        x.style.color = '#ef4444';
                    } else {
                        x.style.background = 'transparent';
                        x.style.color = 'white';
                    }
                }
            });

            // recompute sizes disabled state based on selected color
            refreshOptionStates();
        });
    });

    // Size buttons
    modal.querySelectorAll('.variant-size').forEach(b => {
        b.addEventListener('click', function() {
            if (this.hasAttribute('disabled')) return; // ignore clicks on disabled
            const thisSize = this.getAttribute('data-size');
            // Toggle selection
            if (selectedSize === thisSize) {
                selectedSize = null;
            } else {
                selectedSize = thisSize;
            }

            modal.querySelectorAll('.variant-size').forEach(x => {
                if (x.getAttribute('data-size') === selectedSize) {
                    x.style.background = '#f8af1e';
                    x.style.color = '#000';
                } else {
                    if (x.hasAttribute('disabled')) {
                        x.style.background = 'rgba(239,68,68,0.08)';
                        x.style.color = '#ef4444';
                    } else {
                        x.style.background = 'transparent';
                        x.style.color = 'white';
                    }
                }
            });

            // recompute colors disabled state based on selected size
            refreshOptionStates();
        });
    });

    // Initialize states (apply global disabled rules)
    refreshOptionStates();

    // Hover feedback: ensure enabled options show a hover state even when others are disabled
    modal.querySelectorAll('.variant-color, .variant-size').forEach(el => {
        el.addEventListener('mouseenter', function() {
            if (this.hasAttribute('disabled')) return;
            const isColor = this.classList.contains('variant-color');
            const isSize = this.classList.contains('variant-size');
            const isSelectedColor = isColor && (selectedColor === this.getAttribute('data-color'));
            const isSelectedSize = isSize && (selectedSize === this.getAttribute('data-size'));
            // Only apply hover effect if not currently selected
            if (!isSelectedColor && !isSelectedSize) {
                this.style.background = 'rgba(248,175,30,0.12)';
                this.style.color = '#f8af1e';
            }
        });
        el.addEventListener('mouseleave', function() {
            if (this.hasAttribute('disabled')) return;
            const isColor = this.classList.contains('variant-color');
            const isSize = this.classList.contains('variant-size');
            const isSelectedColor = isColor && (selectedColor === this.getAttribute('data-color'));
            const isSelectedSize = isSize && (selectedSize === this.getAttribute('data-size'));
            // Revert hover styling; keep selected look if selected
            if (isSelectedColor || isSelectedSize) {
                this.style.background = '#f8af1e';
                this.style.color = '#000';
            } else {
                this.style.background = 'transparent';
                this.style.color = 'white';
            }
        });
    });

    // Cancel buttons
    modal.querySelectorAll('#variantCancel, #variantCancel2').forEach(btn => {
        btn.addEventListener('click', function() {
            modal.remove();
            if (typeof callback === 'function') callback(null);
        });
    });

    // Click outside to dismiss
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
            if (typeof callback === 'function') callback(null);
        }
    });

    // Confirm
    document.getElementById('variantConfirm').addEventListener('click', function() {
        if (!selectedColor || !selectedSize) return;
        modal.remove();
        if (typeof callback === 'function') callback({ color: selectedColor, size: selectedSize });
    });
}

function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    
    const cartIcon = document.querySelector('.icons ion-icon[name="cart-outline"]');
    if (cartIcon) {
        // Remove existing badge
        const existingBadge = cartIcon.parentElement.querySelector('.cart-badge');
        if (existingBadge) {
            existingBadge.remove();
        }
        
        // Add new badge if there are items
        if (totalItems > 0) {
            const badge = document.createElement('span');
            badge.className = 'cart-badge';
            badge.textContent = totalItems;
            badge.style.cssText = `
                position: absolute;
                top: -5px;
                right: -5px;
                background: #f8af1e;
                color: #000;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.75rem;
                font-weight: 700;
            `;
            cartIcon.parentElement.style.position = 'relative';
            cartIcon.parentElement.appendChild(badge);
        }
    }
}

function viewCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    let cartHTML = `
        <div style="
            color: white; 
            padding: 40px 30px; 
            max-width: 700px; 
            width: 90%;
            margin: 20px auto;
            background: rgba(11, 15, 19, 0.98);
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        ">
            <div style="
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #f8af1e;
            ">
                <h2 style="
                    color: #f8af1e; 
                    margin: 0;
                    font-size: 2rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <ion-icon name="cart-outline" style="font-size: 2rem;"></ion-icon>
                    Your Cart
                </h2>
                <button onclick="closeCart()" style="
                    background: transparent;
                    border: none;
                    color: #f8af1e;
                    font-size: 2rem;
                    cursor: pointer;
                    padding: 0;
                    width: 35px;
                    height: 35px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
                    <ion-icon name="close-outline"></ion-icon>
                </button>
            </div>
    `;
    
    if (cart.length === 0) {
        cartHTML += `
            <div style="
                text-align: center;
                padding: 60px 20px;
            ">
                <ion-icon name="cart-outline" style="
                    font-size: 5rem;
                    color: rgba(248, 175, 30, 0.3);
                    margin-bottom: 20px;
                "></ion-icon>
                <h3 style="
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 1.5rem;
                    margin-bottom: 10px;
                ">
                    Your cart is empty
                </h3>
                <p style="
                    color: rgba(255, 255, 255, 0.5);
                    margin-bottom: 30px;
                    font-size: 1rem;
                ">
                    Add some delicious dimsum to get started!
                </p>
                <button onclick="closeCart()" style="
                    background: #f8af1e; 
                    color: #000; 
                    border: none; 
                    padding: 15px 30px; 
                    border-radius: 10px; 
                    font-weight: 700; 
                    cursor: pointer;
                    font-size: 1rem;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                " onmouseover="this.style.background='#e48a0a'" onmouseout="this.style.background='#f8af1e'">
                    <ion-icon name="restaurant-outline" style="font-size: 1.2rem;"></ion-icon>
                    Browse Products
                </button>
            </div>
        `;
    } else {
        cartHTML += `<div style="max-height: 400px; overflow-y: auto; margin-bottom: 25px;">`;
        
        let total = 0;
        cart.forEach((item, index) => {
    const price = parseFloat(String(item.price).replace(/[^0-9.-]+/g, ''));
        const itemTotal = price * item.quantity;
        total += itemTotal;
        // Display color and size if available
        const variantInfo = ((item.color || item.size) ? `<div style="color: rgba(255,255,255,0.6); font-size:0.95rem; margin-top:6px;">${item.color ? 'Color: ' + item.color : ''}${(item.color && item.size) ? ' | ' : ''}${item.size ? 'Size: ' + item.size : ''}</div>` : '');

            cartHTML += `
                <div style="
                    background: rgba(255, 255, 255, 0.05); 
                    padding: 20px; 
                    margin-bottom: 15px; 
                    border-radius: 12px; 
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    transition: all 0.3s;
                " onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                    <div style="
                        display: flex; 
                        justify-content: space-between; 
                        align-items: center;
                        gap: 20px;
                    ">
                        <div style="flex: 1;">
                            <h3 style="
                                margin: 0 0 10px 0; 
                                font-size: 1.1rem;
                                color: white;
                                font-weight: 600;
                            ">
                                ${item.name}
                            </h3>
                            <div style="
                                display: flex;
                                gap: 12px;
                                align-items: center;
                                flex-wrap: wrap;
                            ">
                                <span style="
                                    color: #f8af1e;
                                    font-size: 0.95rem;
                                    font-weight: 500;
                                ">
                                    ${item.price}
                                </span>
                                ${variantInfo}
                                <span style="
                                    color: rgba(255, 255, 255, 0.6);
                                    font-size: 0.9rem;
                                ">
                                    |
                                </span>
                                <div style="
                                    display: flex;
                                    align-items: center;
                                    gap: 10px;
                                    background: rgba(255, 255, 255, 0.05);
                                    padding: 6px 10px;
                                    border-radius: 8px;
                                    border: 1px solid rgba(255, 255, 255, 0.1);
                                ">
                                    <button onclick="updateQuantity(${index}, -1)" style="
                                        background: rgba(248, 175, 30, 0.2);
                                        color: #f8af1e;
                                        border: none;
                                        width: 28px;
                                        height: 28px;
                                        border-radius: 6px;
                                        cursor: pointer;
                                        font-size: 1.2rem;
                                        font-weight: 700;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        transition: all 0.2s;
                                    " onmouseover="this.style.background='rgba(248,175,30,0.4)'" onmouseout="this.style.background='rgba(248,175,30,0.2)'">
                                        −
                                    </button>
                                    <span style="
                                        color: white;
                                        font-weight: 600;
                                        font-size: 1rem;
                                        min-width: 24px;
                                        text-align: center;
                                    ">
                                        ${item.quantity}
                                    </span>
                                    <button onclick="updateQuantity(${index}, 1)" style="
                                        background: rgba(248, 175, 30, 0.2);
                                        color: #f8af1e;
                                        border: none;
                                        width: 28px;
                                        height: 28px;
                                        border-radius: 6px;
                                        cursor: pointer;
                                        font-size: 1.2rem;
                                        font-weight: 700;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        transition: all 0.2s;
                                    " onmouseover="this.style.background='rgba(248,175,30,0.4)'" onmouseout="this.style.background='rgba(248,175,30,0.2)'">
                                        +
                                    </button>
                                </div>
                                <span style="
                                    color: rgba(255, 255, 255, 0.6);
                                    font-size: 0.9rem;
                                ">
                                    |
                                </span>
                                <span style="
                                    color: #f8af1e;
                                    font-weight: 700;
                                    font-size: 1.1rem;
                                ">
                                    ₱${formatCurrency(itemTotal)}
                                </span>
                            </div>
                        </div>
                        <button onclick="removeFromCart(${index})" style="
                            background: #ef4444; 
                            color: white; 
                            border: none; 
                            padding: 10px 16px; 
                            border-radius: 8px; 
                            cursor: pointer;
                            font-weight: 600;
                            font-size: 0.9rem;
                            transition: all 0.3s;
                            white-space: nowrap;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                        " onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">
                            <ion-icon name="trash-outline" style="font-size: 1.1rem;"></ion-icon>
                            Remove
                        </button>
                    </div>
                </div>
            `;
        });
        
        cartHTML += `
                </div>
                
                <div style="
                    margin-top: 25px; 
                    padding: 25px 20px 20px;
                    border-top: 2px solid rgba(255, 255, 255, 0.1);
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 12px;
                ">
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 25px;
                    ">
                        <h3 style="
                            color: white;
                            margin: 0;
                            font-size: 1.3rem;
                            font-weight: 600;
                        ">
                            Total Amount:
                        </h3>
                        <h3 style="
                            color: #f8af1e;
                            margin: 0;
                            font-size: 1.8rem;
                            font-weight: 700;
                        ">
                            ₱${formatCurrency(total)}
                        </h3>
                    </div>
                    
                    <button onclick="checkout()" style="
                        background: #f8af1e; 
                        color: #000; 
                        border: none; 
                        padding: 15px 24px; 
                        border-radius: 10px; 
                        font-weight: 700; 
                        cursor: pointer; 
                        width: 100%;
                        font-size: 1.1rem;
                        margin-bottom: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                    " onmouseover="this.style.background='#e48a0a'" onmouseout="this.style.background='#f8af1e'">
                        <ion-icon name="card-outline" style="font-size: 1.3rem;"></ion-icon>
                        Proceed to Checkout
                    </button>
                    
                    <button onclick="closeCart()" style="
                        background: rgba(255, 255, 255, 0.1); 
                        color: white; 
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        padding: 15px 24px; 
                        border-radius: 10px; 
                        font-weight: 600; 
                        cursor: pointer; 
                        width: 100%;
                        font-size: 1rem;
                        transition: all 0.3s;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    " onmouseover="this.style.background='rgba(255,255,255,0.15)'; this.style.borderColor='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'; this.style.borderColor='rgba(255,255,255,0.2)'">
                        <ion-icon name="arrow-back-outline" style="font-size: 1.2rem;"></ion-icon>
                        Continue Shopping
                    </button>
                </div>
        `;
    }
    
    cartHTML += `</div>`;
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'cartModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.92);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow-y: auto;
        padding: 20px 0;
    `;
    modal.innerHTML = cartHTML;
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeCart();
        }
    });
    
    document.body.appendChild(modal);
}

function updateQuantity(index, change) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart[index]) {
        cart[index].quantity = (cart[index].quantity || 1) + change;
        
        // Remove item if quantity becomes 0 or less
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Refresh cart view
        closeCart();
        updateCartBadge();
        if (cart.length > 0) {
            viewCart();
        } else {
            showAlert('success', 'Cart cleared!');
        }
    }
}

function removeFromCart(index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Close and reopen cart to refresh
    closeCart();
    updateCartBadge();
    if (cart.length > 0) {
        viewCart();
    } else {
        showAlert('success', 'Cart cleared!');
    }
}

function closeCart() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.remove();
    }
}

function checkout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    let total = 0;
    cart.forEach(item => {
    const price = parseFloat(String(item.price).replace(/[^0-9.-]+/g, ''));
        total += price * item.quantity;
    });
    
    // Close cart and show shipping address form
    closeCart();
    showShippingAddressForm(total);
}

function showShippingAddressForm(total) {
    // Get saved addresses
    const savedAddresses = JSON.parse(localStorage.getItem('shippingAddresses')) || [];
    const defaultAddress = savedAddresses.find(addr => addr.isDefault) || savedAddresses[0];
    
    let formHTML = `
        <div class="shipping-address-form" style="color: white; backdrop-filter: blur(20px);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #f8af1e;">
                <h2 style="
                    color: #f8af1e; 
                    margin: 0;
                    font-size: 2rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <ion-icon name="location-outline" style="font-size: 2rem;"></ion-icon>
                    Shipping Address
                </h2>
                <button onclick="closeShippingForm()" style="
                    background: transparent;
                    border: none;
                    color: #f8af1e;
                    font-size: 2rem;
                    cursor: pointer;
                    padding: 0;
                    width: 35px;
                    height: 35px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
                    <ion-icon name="close-outline"></ion-icon>
                </button>
            </div>
            
            <div class="address-scroll">
    `;
    
    // Show saved addresses if any
    if (savedAddresses.length > 0) {
        formHTML += `
            <div class="saved-addresses">
                <h3 style="color: white; margin-bottom: 15px; font-size: 1.2rem;">Saved Addresses</h3>
        `;
        
        savedAddresses.forEach((addr, index) => {
            formHTML += `
                <div class="address-card" style="background: rgba(255, 255, 255, 0.05); border: ${addr.isDefault ? '2px solid #f8af1e' : '1px solid rgba(255, 255, 255, 0.08)'}; position: relative;">
                    ${addr.isDefault ? '<span style="position: absolute; top: 10px; right: 10px; background: #f8af1e; color: #000; padding: 4px 10px; border-radius: 5px; font-size: 0.75rem; font-weight: 700;">DEFAULT</span>' : ''}
                    <div style="margin-bottom: 10px;">
                        <strong style="color: white; font-size: 1.1rem;">${addr.name}</strong>
                    </div>
                    <p style="color: rgba(255,255,255,0.7); margin: 5px 0; line-height: 1.6;">
                        ${addr.address}<br>
                        ${addr.city}, ${addr.state} ${addr.zipCode}<br>
                        ${addr.country}<br>
                        Phone: ${addr.phone}
                    </p>
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <button onclick="useThisAddress(${index}, ${total})" style="
                            background: #f8af1e;
                            color: #000;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 600;
                            font-size: 0.9rem;
                        " onmouseover="this.style.background='#e48a0a'" onmouseout="this.style.background='#f8af1e'">
                            <ion-icon name="checkmark-outline" style="vertical-align: middle;"></ion-icon> Use This
                        </button>
                        <button onclick="editAddress(${index})" style="
                            background: rgba(255,255,255,0.1);
                            color: white;
                            border: 1px solid rgba(255,255,255,0.2);
                            padding: 8px 16px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 600;
                            font-size: 0.9rem;
                        " onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                            <ion-icon name="create-outline" style="vertical-align: middle;"></ion-icon> Edit
                        </button>
                        <button onclick="deleteAddress(${index})" style="
                            background: rgba(239, 68, 68, 0.2);
                            color: #ef4444;
                            border: 1px solid rgba(239, 68, 68, 0.4);
                            padding: 8px 16px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 600;
                            font-size: 0.9rem;
                        " onmouseover="this.style.background='rgba(239, 68, 68, 0.3)'" onmouseout="this.style.background='rgba(239, 68, 68, 0.2)'">
                            <ion-icon name="trash-outline" style="vertical-align: middle;"></ion-icon>
                        </button>
                    </div>
                </div>
            `;
        });
        
        formHTML += `</div>`;
    }
    
    // Add new address form
    formHTML += `
                <div style="margin-top: 25px;">
                    <button onclick="toggleAddressForm()" id="addNewAddressBtn" style="
                        background: rgba(255,255,255,0.1);
                        color: #f8af1e;
                        border: 1px solid #f8af1e;
                        padding: 12px 20px;
                        border-radius: 10px;
                        cursor: pointer;
                        font-weight: 600;
                        width: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    " onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                        <ion-icon name="add-circle-outline" style="font-size: 1.2rem;"></ion-icon>
                        Add New Address
                    </button>
                    
                    <div id="newAddressForm" style="display: none; margin-top: 20px; background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px;">
                        <h3 style="color: white; margin-bottom: 20px;">New Shipping Address</h3>
                        <form id="addressForm" onsubmit="saveNewAddress(event, ${total})">
                            <div style="margin-bottom: 15px;">
                                <label style="color: rgba(255,255,255,0.8); display: block; margin-bottom: 5px; font-weight: 500;">Full Name *</label>
                                <input type="text" id="addr_name" required style="width: 100%; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 1rem;" value="${defaultAddress?.name || ''}">
                            </div>
                            <div style="margin-bottom: 15px;">
                                <label style="color: rgba(255,255,255,0.8); display: block; margin-bottom: 5px; font-weight: 500;">Address *</label>
                                <input type="text" id="addr_address" required style="width: 100%; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 1rem;" value="${defaultAddress?.address || ''}">
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                                <div>
                                    <label style="color: rgba(255,255,255,0.8); display: block; margin-bottom: 5px; font-weight: 500;">City *</label>
                                    <input type="text" id="addr_city" required style="width: 100%; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 1rem;" value="${defaultAddress?.city || ''}">
                                </div>
                                <div>
                                    <label style="color: rgba(255,255,255,0.8); display: block; margin-bottom: 5px; font-weight: 500;">State/Province *</label>
                                    <input type="text" id="addr_state" required style="width: 100%; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 1rem;" value="${defaultAddress?.state || ''}">
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                                <div>
                                    <label style="color: rgba(255,255,255,0.8); display: block; margin-bottom: 5px; font-weight: 500;">Zip Code *</label>
                                    <input type="text" id="addr_zipCode" required style="width: 100%; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 1rem;" value="${defaultAddress?.zipCode || ''}">
                                </div>
                                <div>
                                    <label style="color: rgba(255,255,255,0.8); display: block; margin-bottom: 5px; font-weight: 500;">Country *</label>
                                    <input type="text" id="addr_country" required style="width: 100%; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 1rem;" value="${defaultAddress?.country || ''}">
                                </div>
                            </div>
                            <div style="margin-bottom: 15px;">
                                <label style="color: rgba(255,255,255,0.8); display: block; margin-bottom: 5px; font-weight: 500;">Phone Number *</label>
                                <input type="tel" id="addr_phone" required style="width: 100%; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 1rem;" value="${defaultAddress?.phone || ''}">
                            </div>
                            <div style="margin-bottom: 20px;">
                                <label style="color: rgba(255,255,255,0.8); display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="addr_default" style="width: 18px; height: 18px; cursor: pointer; accent-color: #f8af1e;">
                                    <span>Set as default address</span>
                                </label>
                            </div>
                            <button type="submit" style="
                                background: #f8af1e;
                                color: #000;
                                border: none;
                                padding: 12px 24px;
                                border-radius: 10px;
                                font-weight: 700;
                                cursor: pointer;
                                width: 100%;
                                font-size: 1rem;
                            " onmouseover="this.style.background='#e48a0a'" onmouseout="this.style.background='#f8af1e'">
                                Save and Continue
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'shippingModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.92);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow-y: auto;
        padding: 20px 0;
    `;
    modal.innerHTML = formHTML;
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeShippingForm();
        }
    });
    
    document.body.appendChild(modal);
}

function toggleAddressForm() {
    const form = document.getElementById('newAddressForm');
    const btn = document.getElementById('addNewAddressBtn');
    if (form.style.display === 'none') {
        form.style.display = 'block';
        btn.innerHTML = '<ion-icon name="remove-circle-outline" style="font-size: 1.2rem;"></ion-icon> Cancel';
    } else {
        form.style.display = 'none';
        btn.innerHTML = '<ion-icon name="add-circle-outline" style="font-size: 1.2rem;"></ion-icon> Add New Address';
    }
}

function saveNewAddress(event, total) {
    event.preventDefault();
    
    const newAddress = {
        name: document.getElementById('addr_name').value,
        address: document.getElementById('addr_address').value,
        city: document.getElementById('addr_city').value,
        state: document.getElementById('addr_state').value,
        zipCode: document.getElementById('addr_zipCode').value,
        country: document.getElementById('addr_country').value,
        phone: document.getElementById('addr_phone').value,
        isDefault: document.getElementById('addr_default').checked
    };
    
    let addresses = JSON.parse(localStorage.getItem('shippingAddresses')) || [];
    
    // If this is default, remove default from others
    if (newAddress.isDefault) {
        addresses = addresses.map(addr => ({ ...addr, isDefault: false }));
    }
    
    addresses.push(newAddress);
    localStorage.setItem('shippingAddresses', JSON.stringify(addresses));
    
    // Complete checkout with new address
    completeCheckout(newAddress, total);
}

function useThisAddress(index, total) {
    const addresses = JSON.parse(localStorage.getItem('shippingAddresses')) || [];
    const selectedAddress = addresses[index];
    completeCheckout(selectedAddress, total);
}

function editAddress(index) {
    const addresses = JSON.parse(localStorage.getItem('shippingAddresses')) || [];
    const address = addresses[index];
    
    // Show the form with pre-filled data
    document.getElementById('newAddressForm').style.display = 'block';
    document.getElementById('addNewAddressBtn').innerHTML = '<ion-icon name="remove-circle-outline" style="font-size: 1.2rem;"></ion-icon> Cancel';
    
    document.getElementById('addr_name').value = address.name;
    document.getElementById('addr_address').value = address.address;
    document.getElementById('addr_city').value = address.city;
    document.getElementById('addr_state').value = address.state;
    document.getElementById('addr_zipCode').value = address.zipCode;
    document.getElementById('addr_country').value = address.country;
    document.getElementById('addr_phone').value = address.phone;
    document.getElementById('addr_default').checked = address.isDefault;
    
    // Delete the old address
    deleteAddress(index, true);
}

function deleteAddress(index, silent = false) {
    if (!silent && !confirm('Are you sure you want to delete this address?')) {
        return;
    }
    
    let addresses = JSON.parse(localStorage.getItem('shippingAddresses')) || [];
    addresses.splice(index, 1);
    localStorage.setItem('shippingAddresses', JSON.stringify(addresses));
    
    if (!silent) {
        // Refresh the form
        closeShippingForm();
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        let total = 0;
        cart.forEach(item => {
            const price = parseFloat(String(item.price).replace(/[^0-9.-]+/g, ''));
            total += price * item.quantity;
        });
        showShippingAddressForm(total);
    }
}

function completeCheckout(address, total) {
    // Close shipping form and show payment options
    closeShippingForm();
    showPaymentOptions(address, total);
}

// Shipping fee helper (fixed)
function getShippingFee() {
    return 60.00; 
}

function showPaymentOptions(address, total) {
    const paymentMethods = [
        { id: 'gcash', name: 'GCash', icon: 'wallet-outline' },
        { id: 'maya', name: 'Maya', icon: 'phone-portrait-outline' },
        { id: 'paypal', name: 'PayPal', icon: 'logo-paypal' }
    ];
    
    let paymentHTML = `
        <div class="shipping-address-form" style="color: white; backdrop-filter: blur(20px); max-height: 90vh; display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #f8af1e;">
                <h2 style="
                    color: #f8af1e; 
                    margin: 0;
                    font-size: 2rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <ion-icon name="card-outline" style="font-size: 2rem;"></ion-icon>
                    Select Payment Method
                </h2>
                <button onclick="closePaymentForm()" style="
                    background: transparent;
                    border: none;
                    color: #f8af1e;
                    font-size: 2rem;
                    cursor: pointer;
                    padding: 0;
                    width: 35px;
                    height: 35px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
                    <ion-icon name="close-outline"></ion-icon>
                </button>
            </div>
            
            <div style="flex: 1; overflow-y: auto; padding-right: 8px; margin-right: -8px;">
                <div style="margin-bottom: 24px;">
                    <div style="background: rgba(248, 175, 30, 0.1); padding: 20px; border-radius: 12px; border: 1px solid rgba(248, 175, 30, 0.3);">
                            <h3 style="color: #f8af1e; margin: 0 0 10px 0; font-size: 1.3rem;">Order Summary</h3>
                            <p style="color: white; margin: 5px 0; font-size: 1.1rem;">
                                <strong>Subtotal:</strong> <span style="color: #f8af1e; font-size: 1.2rem; font-weight: 700;">₱${formatCurrency(total)}</span>
                            </p>
                            <p style="color: white; margin: 5px 0; font-size: 1.1rem;">
                                <strong>Shipping Fee:</strong> <span style="color: #f8af1e; font-size: 1.2rem; font-weight: 700;">₱${formatCurrency(getShippingFee())}</span>
                            </p>
                            <p style="color: white; margin: 8px 0 5px 0; font-size: 1.15rem;">
                                <strong>Total Amount:</strong> <span style="color: #f8af1e; font-size: 1.5rem; font-weight: 700;">₱${formatCurrency(total + getShippingFee())}</span>
                            </p>
                            <p style="color: rgba(255,255,255,0.7); margin: 5px 0; font-size: 0.9rem;">
                                <ion-icon name="location-outline" style="vertical-align: middle;"></ion-icon>
                                Shipping to: ${address.address}, ${address.city}, ${address.state}
                            </p>
                        </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="color: white; margin-bottom: 16px; font-size: 1.2rem;">Choose Your Payment Method</h3>
                    <div style="display: grid; gap: 12px;">
    `;
    
    paymentMethods.forEach(method => {
        paymentHTML += `
            <div id="payment-${method.id}" class="payment-option" data-method-id="${method.id}" data-method-name="${method.name}"
                 style="
                background: rgba(255, 255, 255, 0.05);
                padding: 18px;
                border-radius: 12px;
                border: 2px solid rgba(255, 255, 255, 0.1);
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 15px;
            " 
            onmouseover="if(!this.classList.contains('selected')) {this.style.background='rgba(255,255,255,0.1)'; this.style.borderColor='rgba(248,175,30,0.5)';}" 
            onmouseout="if(!this.classList.contains('selected')) {this.style.background='rgba(255,255,255,0.05)'; this.style.borderColor='rgba(255,255,255,0.1)';}">
                <div style="
                    background: #f8af1e;
                    width: 48px;
                    height: 48px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                ">
                    <ion-icon name="${method.icon}" style="font-size: 1.6rem; color: #000;"></ion-icon>
                </div>
                <div style="flex: 1; min-width: 0;">
                    <h4 style="color: white; margin: 0 0 4px 0; font-size: 1.1rem;">${method.name}</h4>
                    <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 0.82rem;">Pay securely with ${method.name}</p>
                </div>
                <ion-icon name="checkmark-circle" class="payment-check-icon" style="font-size: 1.8rem; color: #f8af1e; display: none; flex-shrink: 0;"></ion-icon>
            </div>
        `;
    });
    
    paymentHTML += `
                    </div>
                </div>
            </div>
            
            <div style="display: flex; gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                <button id="confirmPaymentBtn" onclick="confirmPayment(${total}, ${JSON.stringify(address).replace(/"/g, '&quot;')})" 
                    style="
                    background: #f8af1e;
                    color: #000;
                    border: none;
                    padding: 14px 24px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-weight: 700;
                    font-size: 1rem;
                    flex: 1;
                    opacity: 0.5;
                    pointer-events: none;
                    transition: all 0.3s ease;
                " disabled>
                    <ion-icon name="checkmark-circle-outline" style="vertical-align: middle; font-size: 1.2rem; margin-right: 6px;"></ion-icon>
                    Confirm Payment
                </button>
                <button onclick="closePaymentForm()" style="
                    background: rgba(255,255,255,0.1);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.2);
                    padding: 14px 24px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 1rem;
                    min-width: 100px;
                " onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'paymentModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.92);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow-y: auto;
        padding: 20px 0;
    `;
    modal.innerHTML = paymentHTML;
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closePaymentForm();
        }
    });
    
    document.body.appendChild(modal);
    
    // Add click listeners to payment options after a short delay to ensure DOM is ready
    setTimeout(() => {
        document.querySelectorAll('.payment-option').forEach(option => {
            option.addEventListener('click', function(e) {
                e.stopPropagation();
                const methodId = this.getAttribute('data-method-id');
                const methodName = this.getAttribute('data-method-name');
                console.log('Selected payment:', methodId, methodName);
                highlightPaymentMethod(methodId, methodName);
            });
        });
    }, 100);
}

let selectedPaymentMethod = null;
let selectedPaymentName = null;

function highlightPaymentMethod(methodId, methodName) {
    console.log('highlightPaymentMethod called with:', methodId, methodName);
    
    // Remove selection from all payment methods
    document.querySelectorAll('[id^="payment-"]').forEach(el => {
        el.classList.remove('selected');
        el.style.background = 'rgba(255, 255, 255, 0.05)';
        el.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        const checkIcon = el.querySelector('.payment-check-icon');
        if (checkIcon) checkIcon.style.display = 'none';
    });
    
    // Highlight selected payment method
    const selectedElement = document.getElementById(`payment-${methodId}`);
    if (selectedElement) {
        selectedElement.classList.add('selected');
        selectedElement.style.background = 'rgba(248, 175, 30, 0.15)';
        selectedElement.style.borderColor = '#f8af1e';
        const checkIcon = selectedElement.querySelector('.payment-check-icon');
        if (checkIcon) checkIcon.style.display = 'block';
    }
    
    // Store selected method
    selectedPaymentMethod = methodId;
    selectedPaymentName = methodName;
    console.log('Stored payment method:', selectedPaymentMethod, selectedPaymentName);
    
    // Enable confirm button
    const confirmBtn = document.getElementById('confirmPaymentBtn');
    if (confirmBtn) {
        confirmBtn.style.opacity = '1';
        confirmBtn.style.pointerEvents = 'auto';
        confirmBtn.disabled = false;
        confirmBtn.onmouseover = function() { this.style.background = '#e48a0a'; };
        confirmBtn.onmouseout = function() { this.style.background = '#f8af1e'; };
    }
}

function confirmPayment(total, address) {
    console.log('confirmPayment called. selectedPaymentMethod:', selectedPaymentMethod, 'selectedPaymentName:', selectedPaymentName);
    
    if (!selectedPaymentMethod || !selectedPaymentName) {
        showAlert('error', 'Please select a payment method first.');
        return;
    }
    
    // Capture selected payment before closing the modal (closePaymentForm resets the globals)
    const paymentMethodIdToSave = selectedPaymentMethod;
    const paymentMethodNameToSave = selectedPaymentName;

    // Process payment
    closePaymentForm();

    // Capture cart items before clearing so we can persist them on the order
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];

    // Save order to localStorage
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    const shippingFee = getShippingFee();
    const finalTotal = parseFloat((total + shippingFee).toFixed(2));

    orders.push({
        id: Date.now(),
        date: new Date().toISOString(),
        // store total including shipping so all views reflect amount charged
        total: finalTotal,
        subtotal: parseFloat(total.toFixed(2)),
        shippingFee: shippingFee,
        address: address,
    // Save both ID and display name for robustness
    paymentMethodId: paymentMethodIdToSave,
    paymentMethodName: paymentMethodNameToSave,
    // Keep legacy field for backward compatibility in any other views
    paymentMethod: paymentMethodNameToSave,
        status: 'Processing',
        // Persist the ordered items so admin/staff can review them
        items: cartItems
    });
    localStorage.setItem('orders', JSON.stringify(orders));

    // Clear cart after saving the order
    localStorage.setItem('cart', JSON.stringify([]));
    updateCartBadge();
    
    // Use resolved friendly name to avoid 'via null' or raw ids
    const displayPayment = resolvePaymentLabel({ paymentMethodName: paymentMethodNameToSave, paymentMethod: paymentMethodNameToSave, paymentMethodId: paymentMethodIdToSave }) || paymentMethodNameToSave || 'selected payment method';
    showAlert('success', `Payment successful via ${displayPayment}! Subtotal: ₱${formatCurrency(total)}, Shipping: ₱${formatCurrency(shippingFee)}, Total: ₱${formatCurrency(finalTotal)} - Order is being processed.`);
    
    // Reset selected payment
    selectedPaymentMethod = null;
    selectedPaymentName = null;
}

function closePaymentForm() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.remove();
    }
    // Reset selected payment
    selectedPaymentMethod = null;
    selectedPaymentName = null;
}

function closeShippingForm() {
    const modal = document.getElementById('shippingModal');
    if (modal) {
        modal.remove();
    }
}

// ============================================
// SUBSCRIBE FORM
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const subscribeForm = document.querySelector('.subscribe-form');
    if (subscribeForm) {
        subscribeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailInput = this.querySelector('input[type="email"]');
            const email = emailInput.value;
            
            // Store subscription
            let subscribers = JSON.parse(localStorage.getItem('subscribers')) || [];
            if (!subscribers.includes(email)) {
                subscribers.push(email);
                localStorage.setItem('subscribers', JSON.stringify(subscribers));
                showAlert('success', 'Successfully subscribed to our newsletter!');
                emailInput.value = '';
            } else {
                showAlert('error', 'This email is already subscribed!');
            }
        });
    }
});

// ============================================
// ALERT MESSAGES
// ============================================

// Show alert messages
function showAlert(type, message) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert-message');
    existingAlerts.forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert-message alert-${type}`;
    
    const icon = type === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline';
    alertDiv.innerHTML = `
        <ion-icon name="${icon}"></ion-icon>
        <span>${message}</span>
    `;
    
    // Always show centered at top
    document.body.insertAdjacentElement('afterbegin', alertDiv);
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.left = '50%';
    alertDiv.style.transform = 'translateX(-50%)';
    alertDiv.style.zIndex = '10001';
    alertDiv.style.minWidth = '320px';
    alertDiv.style.maxWidth = '90%';
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// ============================================
// MENU AVAILABILITY SYNC (Customer UI reflects Admin toggles)
// ============================================

function isMenuItemAvailableByName(name, color = null, size = null) {
    try {
        const items = JSON.parse(localStorage.getItem('menuItems')) || [];
        const found = items.find(i => (i.name || '').toLowerCase() === (name || '').toLowerCase());
        if (!found) return true; // default to true if not found

        // If no variant specified, return whole-item availability
        if (!color && !size) return !!found.available;

        // If there are no unavailableVariants configured, assume available
        const unavailable = found.unavailableVariants || [];
        if (!unavailable.length) return !!found.available;

        // A variant is considered unavailable if any configured rule matches.
        // Rules may be color-only, size-only, or both.
        const matches = unavailable.some(v => {
            // both color and size specified in rule => both must match
            if (v.color && v.size) return (v.color === color && v.size === size);
            // color-only rule
            if (v.color && !v.size) return (v.color === color);
            // size-only rule
            if (!v.color && v.size) return (v.size === size);
            return false;
        });

        // If a matching unavailable rule exists, that variant is unavailable.
        if (matches) return false;

        // Otherwise, fallback to whole-item availability
        return !!found.available;
    } catch {
        return true;
    }
}

function applyAvailabilityUI() {
    const cards = document.querySelectorAll('.menu-card');
    cards.forEach(card => {
        const nameEl = card.querySelector('h3');
        const btn = card.querySelector('.add-btn');
        if (!nameEl || !btn) return;

        const name = nameEl.textContent.trim();
        const available = isMenuItemAvailableByName(name);

        if (!available) {
            // Disable add to cart button and indicate unavailable
            btn.disabled = true;
            btn.textContent = 'Unavailable';
            btn.style.background = 'rgba(239, 68, 68, 0.7)';
            btn.style.cursor = 'not-allowed';
            // Dim the card slightly for visual feedback
            card.style.opacity = '0.85';
        } else {
            // Restore default button if previously disabled
            btn.disabled = false;
            btn.textContent = 'Add to Cart';
            btn.style.background = '';
            btn.style.cursor = '';
            card.style.opacity = '';
        }
    });
}

// Re-apply availability on load and when storage changes (e.g., admin toggles availability)
document.addEventListener('DOMContentLoaded', function() {
    applyAvailabilityUI();
});

window.addEventListener('storage', function(e) {
    if (e.key === 'menuItems') {
        applyAvailabilityUI();
    }
});

// ============================================
// REVIEW CAROUSEL FUNCTIONALITY
// ============================================

// Review Buttons Functionality
document.addEventListener('DOMContentLoaded', function() {
    const reviewCards = document.querySelectorAll('.review-card');
    const prevBtns = document.querySelectorAll('.prev-btn');
    const nextBtns = document.querySelectorAll('.next-btn');
    const firstPrevBtn = document.getElementById('prevBtn');
    const firstNextBtn = document.getElementById('nextBtn');
    let currentReview = 0;

    function showReview(index) {
        reviewCards.forEach((card, i) => {
            card.classList.remove('active');
            if (i === index) {
                card.classList.add('active');
            }
        });
    }

    // Next buttons
    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentReview = (currentReview + 1) % reviewCards.length;
            showReview(currentReview);
        });
    });

    if (firstNextBtn) {
        firstNextBtn.addEventListener('click', () => {
            currentReview = (currentReview + 1) % reviewCards.length;
            showReview(currentReview);
        });
    }

    // Previous buttons
    prevBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentReview = (currentReview - 1 + reviewCards.length) % reviewCards.length;
            showReview(currentReview);
        });
    });

    if (firstPrevBtn) {
        firstPrevBtn.addEventListener('click', () => {
            currentReview = (currentReview - 1 + reviewCards.length) % reviewCards.length;
            showReview(currentReview);
        });
    }

    // Auto-advance reviews every 5 seconds
    if (reviewCards.length > 0) {
        setInterval(() => {
            currentReview = (currentReview + 1) % reviewCards.length;
            showReview(currentReview);
        }, 5000);
    }

    // Keyboard navigation for reviews
    document.addEventListener('keydown', (e) => {
        if (reviewCards.length > 0) {
            if (e.key === 'ArrowLeft') {
                currentReview = (currentReview - 1 + reviewCards.length) % reviewCards.length;
                showReview(currentReview);
            } else if (e.key === 'ArrowRight') {
                currentReview = (currentReview + 1) % reviewCards.length;
                showReview(currentReview);
            }
        }
    });
});

// ============================================
// SCROLL ANIMATIONS
// ============================================

// Add fade-in animation on scroll
document.addEventListener('DOMContentLoaded', function() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe service cards, menu cards, and review sections
    const animatedElements = document.querySelectorAll('.service-card, .menu-card, .review-container, .subscribe-content');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// ============================================
// BACK TO TOP BUTTON
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Create back to top button
    const backToTopBtn = document.createElement('button');
    backToTopBtn.innerHTML = '<ion-icon name="arrow-up-outline"></ion-icon>';
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        background: #f8af1e;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(248, 175, 30, 0.4);
    `;
    
    backToTopBtn.querySelector('ion-icon').style.cssText = `
        font-size: 1.5rem;
        color: #000;
    `;
    
    document.body.appendChild(backToTopBtn);
    
    // Show/hide back to top button
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.style.display = 'flex';
        } else {
            backToTopBtn.style.display = 'none';
        }
    });
    
    // Scroll to top when clicked
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Hover effect
    backToTopBtn.addEventListener('mouseenter', () => {
        backToTopBtn.style.transform = 'scale(1.1)';
        backToTopBtn.style.background = '#e48a0a';
    });
    
    backToTopBtn.addEventListener('mouseleave', () => {
        backToTopBtn.style.transform = 'scale(1)';
        backToTopBtn.style.background = '#f8af1e';
    });
});

// ============================================
// NAVBAR SCROLL EFFECT
// ============================================

let lastScroll = 0;
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        nav.style.background = 'rgba(11, 15, 19, 0.95)';
        nav.style.boxShadow = '0 8px 30px rgba(0,0,0,0.8)';
    } else {
        nav.style.background = 'var(--card-bg)';
        nav.style.boxShadow = 'var(--glass-shadow)';
    }
    
    lastScroll = currentScroll;
});

// Backfill/migrate existing orders in localStorage to include paymentMethodId/paymentMethodName
function normalizeExistingOrders() {
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    if (!orders.length) return;

    let changed = false;
    // Use the robust resolver to fill missing fields where possible
    orders = orders.map(o => {
        const updated = { ...o };
        try {
            const resolved = resolvePaymentLabel(updated);
            if (resolved && resolved !== 'Unknown') {
                // If a friendly name can be resolved, ensure both name and legacy field exist
                if (updated.paymentMethodName !== resolved) {
                    updated.paymentMethodName = resolved;
                    changed = true;
                }
                if (!updated.paymentMethod || updated.paymentMethod !== resolved) {
                    updated.paymentMethod = resolved;
                    changed = true;
                }
                // Map friendly name back to canonical id
                const nameToId = { 'GCash': 'gcash', 'Maya': 'maya', 'PayPal': 'paypal' };
                const id = nameToId[resolved] || (typeof updated.paymentMethodId === 'string' ? updated.paymentMethodId : null);
                if (id && updated.paymentMethodId !== id) {
                    updated.paymentMethodId = id;
                    changed = true;
                }
            } else {
                // Try additional heuristics: if paymentMethodId is an object, extract id/name
                if (updated.paymentMethodId && typeof updated.paymentMethodId === 'object') {
                    const maybeId = updated.paymentMethodId.id || updated.paymentMethodId.name;
                    if (maybeId) {
                        const fix = resolvePaymentLabel({ paymentMethodId: maybeId, paymentMethodName: updated.paymentMethodName, paymentMethod: updated.paymentMethod });
                        if (fix && fix !== 'Unknown') {
                            updated.paymentMethodName = fix;
                            updated.paymentMethod = fix;
                            const nameToId = { 'GCash': 'gcash', 'Maya': 'maya', 'PayPal': 'paypal' };
                            updated.paymentMethodId = nameToId[fix] || String(maybeId);
                            changed = true;
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('normalizeExistingOrders: error while normalizing order', updated.id, e);
        }
        return updated;
    });

    if (changed) {
        localStorage.setItem('orders', JSON.stringify(orders));
    }
}

// Resolve payment method label robustly for display (customer-side helper)
function resolvePaymentLabel(order) {
    // Always try to infer one of the canonical names: 'GCash', 'Maya', 'PayPal'.
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

    const direct = (asString(order.paymentMethodName) || asString(order.paymentMethod) || asString(order.paymentMethodId) || '').trim().toLowerCase();
    if (direct === 'gcash') return 'GCash';
    if (direct === 'maya' || direct === 'paymaya') return 'Maya';
    if (direct === 'paypal') return 'PayPal';

    return 'Unknown';
}

// Confirm received: move order from 'orders' into 'purchaseHistory'
function confirmReceived(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
        showAlert('error', 'Order not found.');
        return;
    }

    const order = orders[orderIndex];

    // Mark order as confirmed by customer (keep it in orders for admin/staff view)
    order.confirmedReceived = true;
    order.confirmedDate = new Date().toISOString();

    // prepare purchase entry
    const purchaseEntry = {
        id: order.id,
        date: order.confirmedDate,
        originalOrderDate: order.date,
        total: order.total,
        items: order.items || order.cart || [],
        paymentMethodId: order.paymentMethodId || order.paymentMethod || null,
        paymentMethodName: order.paymentMethodName || order.paymentMethod || null,
        address: order.address || null
    };

    // save purchase history
    const history = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
    history.push(purchaseEntry);
    localStorage.setItem('purchaseHistory', JSON.stringify(history));

    // persist updated orders
    localStorage.setItem('orders', JSON.stringify(orders));

    showAlert('success', 'We’re grateful you chose to order from us!');

    // refresh modal UI: close and re-open to reflect changes
    closeOrderStatusModal();
    setTimeout(() => showOrderStatus(), 300);
}

// Show Purchase History modal for customers
function showPurchaseHistory() {
    const history = JSON.parse(localStorage.getItem('purchaseHistory')) || [];

    let html = `
        <div class="shipping-address-form" style="color: white; backdrop-filter: blur(20px); max-height: 90vh; display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #f8af1e;">
                <h2 style="color: #f8af1e; margin: 0; font-size: 2rem; font-weight: 700; display: flex; align-items: center; gap: 10px;">
                    <ion-icon name="bag-check-outline" style="font-size: 2rem;"></ion-icon>
                    Purchase History
                </h2>
                <button onclick="closePurchaseHistoryModal()" style="background: transparent; border: none; color: #f8af1e; font-size: 2rem; cursor: pointer; padding: 0; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'"><ion-icon name="close-outline"></ion-icon></button>
            </div>
    `;

    if (history.length === 0) {
        html += `
            <div style="text-align: center; padding: 60px 20px;">
                <ion-icon name="bag-check-outline" style="font-size: 5rem; color: rgba(248, 175, 30, 0.3); margin-bottom: 20px;"></ion-icon>
                <h3 style="color: rgba(255, 255, 255, 0.8); font-size: 1.5rem; margin-bottom: 10px;">No Purchase History</h3>
                <p style="color: rgba(255, 255, 255, 0.5); margin-bottom: 30px; font-size: 1rem;">You haven't confirmed any received orders yet.</p>
                <button onclick="closePurchaseHistoryModal()" style="background: #f8af1e; color: #000; border: none; padding: 15px 30px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 1rem;" onmouseover="this.style.background='#e48a0a'" onmouseout="this.style.background='#f8af1e'">Browse Products</button>
            </div>
        `;
    } else {
        html += `<div style="flex:1; overflow-y:auto; padding-right:8px;">`;
        history.slice().reverse().forEach(entry => {
            const d = new Date(entry.date);
            html += `
                <div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius:12px; margin-bottom:12px; border:1px solid rgba(255,255,255,0.08);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <div>
                            <p style="color: rgba(255,255,255,0.6); margin:0; font-size:0.85rem;">Order #${entry.id}</p>
                            <p style="color:white; margin:0; font-size:1.05rem; font-weight:600;">₱${formatCurrency(entry.total || 0)}</p>
                        </div>
                        <p style="color: rgba(255,255,255,0.7); margin:0; font-size:0.85rem;">${d.toLocaleDateString()}</p>
                    </div>
                    <div style="border-top:1px solid rgba(255,255,255,0.06); padding-top:8px;">
                        ${(entry.items||[]).map(it=>{ const price = parseFloat(String(it.price || it.unitPrice || '0').replace(/[^0-9.-]+/g, '')) || 0; const qty = it.quantity || 1; const itemTotal = price * qty; const variantInfo = ((it.color || it.size) ? `<div style="color: rgba(255,255,255,0.6); font-size:0.9rem; margin-top:6px;">${it.color ? 'Color: ' + it.color : ''}${(it.color && it.size) ? ' | ' : ''}${it.size ? 'Size: ' + it.size : ''}</div>` : ''); return `<div style="display:flex; justify-content:space-between; align-items:center; font-size:0.95rem; color:rgba(255,255,255,0.85); margin-bottom:8px;"><div style="min-width:0;"><div style="font-weight:700; color:white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${it.name}</div><div style="color:rgba(255,255,255,0.65); font-size:0.9rem; display:flex; justify-content:flex-start; align-items:center; gap:8px; margin:6px 0;">₱${formatCurrency(price)} <span style=\"color: rgba(255,255,255,0.6);\">×</span> ${qty}</div>${variantInfo}</div><div style="font-weight:700; color:#f8af1e;">₱${formatCurrency(itemTotal)}</div></div>` }).join('')}
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `</div>`;

    const modal = document.createElement('div');
    modal.id = 'purchaseHistoryModal';
    modal.style.cssText = `position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.92); z-index:10000; display:flex; align-items:center; justify-content:center; overflow-y:auto; padding:20px 0;`;
    modal.innerHTML = html;
    modal.addEventListener('click', function(e){ if (e.target === modal) closePurchaseHistoryModal(); });
    document.body.appendChild(modal);
}

function closePurchaseHistoryModal() { const m = document.getElementById('purchaseHistoryModal'); if (m) m.remove(); }

// ============================================
// FAQ COLLAPSE/EXPAND
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const faqButtons = document.querySelectorAll('.faq-item .faq-q');
    faqButtons.forEach(btn => {
        // Ensure keyboard accessibility
        btn.setAttribute('role', 'button');
        btn.addEventListener('click', function(e) {
            const item = this.closest('.faq-item');
            const answer = item.querySelector('.faq-a');
            const isOpen = item.classList.toggle('open');

            this.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            if (answer) {
                answer.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
                // For smooth collapse/expand ensure maxHeight is set (works with CSS max-height transition)
                if (isOpen) {
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                } else {
                    answer.style.maxHeight = null;
                }
            }
        });

        // Allow Enter/Space to toggle
        btn.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
});