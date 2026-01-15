// ========================================
// Animation Helpers
// ========================================

const Animations = {
    // Show element with animation
    show(element, animationClass = 'fade-in') {
        element.style.display = '';
        element.classList.add(animationClass);
    },

    // Hide element
    hide(element) {
        element.style.display = 'none';
    },

    // Show loading overlay
    showLoading(message = 'Chargement...') {
        let overlay = document.getElementById('loading-overlay');

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
        <div class="spinner"></div>
        <div class="loading-text">${message}</div>
      `;
            document.body.appendChild(overlay);
        } else {
            overlay.querySelector('.loading-text').textContent = message;
            overlay.style.display = 'flex';
        }

        return overlay;
    },

    // Hide loading overlay
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    },

    // Show alert
    showAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
      <span>${message}</span>
    `;

        const container = document.querySelector('.container') || document.body;
        container.insertBefore(alert, container.firstChild);

        setTimeout(() => {
            alert.remove();
        }, 5000);
    },

    // Show success message
    showSuccess(message) {
        this.showAlert(message, 'success');
    },

    // Show error message
    showError(message) {
        this.showAlert(message, 'error');
    },

    // Show modal
    showModal(title, content, onClose) {
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';

        backdrop.innerHTML = `
      <div class="modal modal-content">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
      </div>
    `;

        document.body.appendChild(backdrop);

        const closeBtn = backdrop.querySelector('.modal-close');
        const closeModal = () => {
            backdrop.remove();
            if (onClose) onClose();
        };

        closeBtn.addEventListener('click', closeModal);
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeModal();
        });

        return backdrop;
    },

    // Scroll to element
    scrollTo(element, offset = 100) {
        const top = element.offsetTop - offset;
        window.scrollTo({
            top: top,
            behavior: 'smooth'
        });
    },

    // Add stagger animation to elements
    staggerAnimate(elements, animationClass = 'fade-in-up', delay = 100) {
        elements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add(animationClass);
            }, index * delay);
        });
    }
};

// Export for use in other modules
window.Animations = Animations;
