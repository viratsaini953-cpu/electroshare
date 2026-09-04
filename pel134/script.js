document.addEventListener('DOMContentLoaded', () => {
    // Mobile navigation menu toggle
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = mobileToggle.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.className = 'fa-solid fa-xmark';
            } else {
                icon.className = 'fa-solid fa-bars';
            }
        });
    }

    // Close menu when clicking nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                if (mobileToggle) {
                    mobileToggle.querySelector('i').className = 'fa-solid fa-bars';
                }
            }
        });
    });

    // Copy portfolio URL button handler
    const btnCopyUrl = document.getElementById('btn-copy-url');
    const toast = document.getElementById('toastNotification');

    if (btnCopyUrl) {
        btnCopyUrl.addEventListener('click', () => {
            navigator.clipboard.writeText(window.location.href).then(() => {
                showToast();
            }).catch(() => {
                showToast();
            });
        });
    }

    function showToast() {
        if (!toast) return;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
});

// CV Modal Functions
function openCvModal() {
    const cvModal = document.getElementById('cvModal');
    if (cvModal) {
        cvModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeCvModal() {
    const cvModal = document.getElementById('cvModal');
    if (cvModal) {
        cvModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close CV modal on Escape key press
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeCvModal();
    }
});
