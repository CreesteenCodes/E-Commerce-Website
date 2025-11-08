// Initialize staff accounts (demo accounts)
function initializeStaffAccounts() {
    if (!localStorage.getItem('staffAccounts')) {
        const defaultStaff = [
            {
                id: 1,
                name: 'Staff Member',
                email: 'staff@silvermoon.com',
                password: 'silvermoon.staff',
                role: 'staff',
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                name: 'Administrator',
                email: 'admin@silvermoon.com',
                password: 'silvermoon.admin',
                role: 'admin',
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem('staffAccounts', JSON.stringify(defaultStaff));
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeStaffAccounts();
    // Migrate existing default accounts to new passwords if needed
    migrateDefaultStaffPasswords();
});

// Migrate passwords for default seeded accounts if they already exist in storage
function migrateDefaultStaffPasswords() {
    const raw = localStorage.getItem('staffAccounts');
    if (!raw) return;
    let accounts;
    try {
        accounts = JSON.parse(raw) || [];
    } catch (e) {
        return;
    }

    let changed = false;
    accounts = accounts.map(acc => {
        // Migrate old default emails (dimsum) to new silvermoon credentials
        if (acc && (acc.email === 'staff@dimsum.com' || acc.email === 'staff@silvermoon.com') && acc.role === 'staff') {
            changed = true;
            return { ...acc, email: 'staff@silvermoon.com', password: 'silvermoon.staff' };
        }
        if (acc && (acc.email === 'admin@dimsum.com' || acc.email === 'admin@silvermoon.com') && acc.role === 'admin') {
            changed = true;
            return { ...acc, email: 'admin@silvermoon.com', password: 'silvermoon.admin' };
        }
        return acc;
    });

    if (changed) {
        localStorage.setItem('staffAccounts', JSON.stringify(accounts));
    }
}

// Handle Staff/Admin Login
function handleStaffLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('staffEmail').value.trim().toLowerCase();
    const password = document.getElementById('staffPassword').value;
    const role = document.getElementById('staffRole').value;
    const rememberMe = document.getElementById('staffRememberMe').checked;
    
    // Get stored staff accounts
    const staffAccounts = JSON.parse(localStorage.getItem('staffAccounts')) || [];
    
    // Find staff member
    const staff = staffAccounts.find(s => 
        (s.email || '').toLowerCase() === email && 
        s.password === password && 
        s.role === role
    );
    
    if (staff) {
        // Login successful
        localStorage.setItem('isStaffLoggedIn', 'true');
        localStorage.setItem('currentStaff', JSON.stringify({
            id: staff.id,
            name: staff.name,
            email: staff.email,
            role: staff.role
        }));
        
        if (rememberMe) {
            localStorage.setItem('staffRememberMe', 'true');
        }
        
        showAlert('success', 'Login successful! Redirecting to dashboard...');
        
        setTimeout(() => {
            window.location.href = 'templates/dashboard.html';
        }, 1500);
    } else {
        showAlert('error', 'Invalid credentials or incorrect role selected!');
    }
    
    return false;
}

// Handle Staff/Admin Logout
function handleStaffLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('isStaffLoggedIn');
        localStorage.removeItem('currentStaff');
        localStorage.removeItem('staffRememberMe');
        
        showAlert('success', 'Logged out successfully!');
        
        setTimeout(() => {
            window.location.href = '../admin_staff.html';
        }, 1000);
    }
}

// ============================================
// INITIALIZATION FUNCTIONS
// ============================================

// Initialize menu items if not present
function initializeMenuItems() {
    const defaultMenuItems = [
        { id: 1, name: "Men's Loose Fit Hoodie", price: 999.00, category: 'Hoodies', image: '../static/images/products/Men\'s Loose Fit Hoodie.webp', available: true },
        { id: 2, name: "Men's Loose Fit Printed Hoodie", price: 1790.00, category: 'Hoodies', image: '../static/images/products/Men\'s Loose Fit Printed Hoodie.webp', available: true },
        { id: 3, name: "Men's Regular Fit Hoodie", price: 1790.00, category: 'Hoodies', image: '../static/images/products/Men\'s Regular Fit Hoodie.webp', available: true },
        { id: 4, name: "Men's Regular Fit Printed Hoodie", price: 1490.00, category: 'Hoodies', image: '../static/images/products/Men\'s Regular Fit Printed Hoodie.webp', available: true },

        { id: 5, name: "Women's Oversized Zip-Through Hoodie", price: 1490.00, category: 'Hoodies', image: '../static/images/products/Women\'s Oversized Zip-Through Hoodie.webp', available: true },
        { id: 6, name: "Women's Hoodie", price: 999.00, category: 'Hoodies', image: '../static/images/products/Women\'s Hoodie.webp', available: true },
        { id: 7, name: "Women's Zip-Through Hoodie", price: 999.00, category: 'Hoodies', image: '../static/images/products/Women\'s Zip-Through Hoodie.webp', available: true },
        { id: 8, name: "Women's Hooded Top", price: 999.00, category: 'Hoodies', image: '../static/images/products/Women\'s Hooded Top.webp', available: true },

        { id: 9, name: 'Kids Motif-Detail Hoodie', price: 999.00, category: 'Hoodies', image: '../static/images/products/Kids Motif-Detail Hoodie.webp', available: true },
        { id: 10, name: 'Kids Logo Zip Hoodie In Fleece', price: 1950.00, category: 'Hoodies', image: '../static/images/products/Kids Logo Zip Hoodie In Fleece.webp', available: true },
        { id: 11, name: 'Kids Hoodie', price: 699.00, category: 'Hoodies', image: '../static/images/products/Kids Hoodie.webp', available: true },
        { id: 12, name: 'Kids Zipped Hoodie', price: 1495.00, category: 'Hoodies', image: '../static/images/products/Kids Zipped Hoodie.webp', available: true },

        { id: 13, name: 'Baby Cotton Hoodie', price: 1295.00, category: 'Hoodies', image: '../static/images/products/Baby Cotton Hoodie.webp', available: true },
        { id: 14, name: 'Baby VintageSoft Logo Hoodie One-Piece', price: 2749.00, category: 'Hoodies', image: '../static/images/products/Baby VintageSoft Logo Hoodie One-Piece.webp', available: true },
        { id: 15, name: 'Baby Printed Hoodie', price: 1295.00, category: 'Hoodies', image: '../static/images/products/Baby Printed Hoodie.webp', available: true },
        { id: 16, name: "Baby Appliquéd Fleece Hoodie", price: 1290.00, category: 'Hoodies', image: '../static/images/products/Baby Appliquéd Fleece Hoodie.webp', available: true },

        { id: 17, name: "Men's Loose Fit Sweatshirt", price: 999.00, category: 'Sweatshirts', image: '../static/images/products/Men\'s Loose Fit Sweatshirt.webp', available: true },
        { id: 18, name: "Men's Oversized Fit Printed Sweatshirt", price: 1790.00, category: 'Sweatshirts', image: '../static/images/products/Men\'s Oversized Fit Printed Sweatshirt.webp', available: true },
        { id: 19, name: "Men's Relaxed Fit Printed Sweatshirt", price: 1290.00, category: 'Sweatshirts', image: '../static/images/products/Men\'s Relaxed Fit Printed Sweatshirt.webp', available: true },
        { id: 20, name: "Men's Regular Fit Sweatshirt", price: 1695.00, category: 'Sweatshirts', image: '../static/images/products/Men\'s Regular Fit Sweatshirt.webp', available: true },

        { id: 21, name: "Women's Text-Motif Sweatshirt", price: 1490.00, category: 'Sweatshirts', image: '../static/images/products/Women\'s Text-Motif Sweatshirt.webp', available: true },
        { id: 22, name: "Women's Oversized Sweatshirt", price: 799.00, category: 'Sweatshirts', image: '../static/images/products/Women\'s Oversized Sweatshirt.webp', available: true },
        { id: 23, name: "Women's Printed Sweatshirt", price: 1490.00, category: 'Sweatshirts', image: '../static/images/products/Women\'s Printed Sweatshirt.webp', available: true },
        { id: 24, name: "Women's Oversized Motif-Detail Sweatshirt", price: 899.00, category: 'Sweatshirts', image: '../static/images/products/Women\'s Oversized Motif-Detail Sweatshirt.webp', available: true },

        { id: 25, name: 'Kids Cotton Sweatshirt', price: 699.00, category: 'Sweatshirts', image: '../static/images/products/Kids Cotton Sweatshirt.webp', available: true },
        { id: 26, name: 'Kids Oversized Crew Sweatshirt', price: 890.00, category: 'Sweatshirts', image: '../static/images/products/Kids Oversized Crew Sweatshirt.webp', available: true },
        { id: 27, name: 'Kids Graphic Print Sweatshirt', price: 1409.00, category: 'Sweatshirts', image: '../static/images/products/Kids Graphic Print Sweatshirt.webp', available: true },
        { id: 28, name: 'Kids Oversized Print-Motif Sweatshirt', price: 999.00, category: 'Sweatshirts', image: '../static/images/products/Kids Oversized Print-Motif Sweatshirt.webp', available: true },

        { id: 29, name: 'Baby Embroidered Teddy Sweatshirt', price: 799.00, category: 'Sweatshirts', image: '../static/images/products/Baby Embroidered Teddy Sweatshirt.webp', available: true },
        { id: 30, name: 'Baby Sweatshirt With Embroidered Teddy Bear', price: 895.00, category: 'Sweatshirts', image: '../static/images/products/Baby Sweatshirt With Embroidered Teddy Bear.webp', available: true },
        { id: 31, name: 'Baby Oversized Sweatshirt', price: 745.00, category: 'Sweatshirts', image: '../static/images/products/Baby Oversized Sweatshirt.webp', available: true },
        { id: 32, name: 'Baby Palm Trees Printed Sweatshirt', price: 1295.00, category: 'Sweatshirts', image: '../static/images/products/Baby Palm Trees Printed Sweatshirt.webp', available: true }
    ];

    const existingRaw = localStorage.getItem('menuItems');
    if (!existingRaw) {
        // Seed fresh
        localStorage.setItem('menuItems', JSON.stringify(defaultMenuItems));
        return;
    }

    // Merge missing items without duplicating existing ones
    let existing = [];
    try { existing = JSON.parse(existingRaw) || []; } catch { existing = []; }

    const existingNames = new Set(existing.map(i => (i.name || '').toLowerCase()));
    let maxId = existing.reduce((m, i) => Math.max(m, typeof i.id === 'number' ? i.id : 0), 0);
    let changed = false;

    defaultMenuItems.forEach(def => {
        const lname = (def.name || '').toLowerCase();
        if (!existingNames.has(lname)) {
            // Add completely new item
            maxId += 1;
            const itemToAdd = { ...def, id: maxId };
            existing.push(itemToAdd);
            existingNames.add(lname);
            changed = true;
        } else {
            // If item exists, sync non-destructive updates from defaults (e.g. price)
            const idx = existing.findIndex(i => (i.name || '').toLowerCase() === lname);
            if (idx !== -1) {
                const existingItem = existing[idx];
                // Sync price if different (user requested default price to reflect in dashboard)
                if (typeof def.price === 'number' && existingItem.price !== def.price) {
                    existing[idx] = { ...existingItem, price: def.price };
                    changed = true;
                }
                // Optionally sync image or category if missing in existing
                if (!existing[idx].image && def.image) {
                    existing[idx].image = def.image;
                    changed = true;
                }
                if (!existing[idx].category && def.category) {
                    existing[idx].category = def.category;
                    changed = true;
                }
            }
        }
    });

    if (changed) {
        localStorage.setItem('menuItems', JSON.stringify(existing));
    }
}

// Initialize all data
document.addEventListener('DOMContentLoaded', function() {
    initializeMenuItems();
});
