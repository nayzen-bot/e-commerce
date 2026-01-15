// ========================================
// Shopping Cart Module
// ========================================

const Cart = {
    items: [],
    STORAGE_KEY: 'shoptonidf_cart',

    // Initialize cart from localStorage
    init() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            try {
                this.items = JSON.parse(saved);
            } catch (e) {
                this.items = [];
            }
        }
        this.updateUI();
    },

    // Save cart to localStorage
    save() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items));
        this.updateUI();
    },

    // Add item to cart
    addItem(product, quantity = 1) {
        const existingItem = this.items.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: quantity
            });
        }

        this.save();
        this.showAddAnimation();
        return true;
    },

    // Remove item from cart
    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.save();
    },

    // Update item quantity
    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            item.quantity = Math.max(1, quantity);
            this.save();
        }
    },

    // Get cart total
    getTotal() {
        return this.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    },

    // Get item count
    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    },

    // Clear cart
    clear() {
        this.items = [];
        this.save();
    },

    // Get cart items
    getItems() {
        return this.items;
    },

    // Update cart UI (badge)
    updateUI() {
        const cartBadges = document.querySelectorAll('.cart-badge');
        const count = this.getItemCount();

        cartBadges.forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        });
    },

    // Show add to cart animation
    showAddAnimation() {
        const cartLinks = document.querySelectorAll('a[href="/cart"]');
        cartLinks.forEach(link => {
            link.classList.add('cart-add');
            setTimeout(() => {
                link.classList.remove('cart-add');
            }, 600);
        });
    }
};

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', () => {
    Cart.init();
});

// Export for use in other modules
window.Cart = Cart;
