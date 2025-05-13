// Mobile nav logic for Astro blog - Simple version (no dialog)
// This script is loaded client-side

function initMobileNav() {
  const menuToggle = document.getElementById('menu-toggle');
  const closeMenu = document.getElementById('close-menu');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = mobileMenu?.querySelectorAll('a');

  // Function to set the aria-expanded attribute
  function setAriaExpanded(expanded) {
    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    }
  }

  // Function to toggle body scroll lock
  const toggleScrollLock = (lock) => {
    document.body.style.overflow = lock ? 'hidden' : '';
  };

  // Function to open the mobile menu
  function openMobileMenu() {
    if (mobileMenu) {
      mobileMenu.classList.remove('hidden');
      mobileMenu.style.display = 'block';
      setAriaExpanded(true);
      toggleScrollLock(true);
    }
  }

  // Function to close the mobile menu
  function closeMobileMenu() {
    if (mobileMenu) {
      mobileMenu.classList.add('hidden');
      mobileMenu.style.display = 'none';
      setAriaExpanded(false);
      toggleScrollLock(false);
    }
  }

  // Toggle menu open when hamburger is clicked
  menuToggle?.addEventListener('click', (e) => {
    e.preventDefault();
    openMobileMenu();
    console.log('Menu button clicked');
  });

  // Close menu when close button is clicked
  closeMenu?.addEventListener('click', () => {
    closeMobileMenu();
  });

  // Close menu when any link is clicked
  mobileLinks?.forEach(link => {
    link.addEventListener('click', () => {
      closeMobileMenu();
    });
  });

  // Close menu when Escape key is pressed
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu && mobileMenu.style.display === 'block') {
      closeMobileMenu();
      menuToggle?.focus();
    }
  });

  // Sticky header behavior
  let lastScrollTop = 0;
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > lastScrollTop && scrollTop > 100) {
      header?.classList.add('-translate-y-full');
    } else {
      header?.classList.remove('-translate-y-full');
    }
    lastScrollTop = scrollTop;
  });

  // Close mobile menu if resizing to md or larger
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768 && mobileMenu && mobileMenu.style.display === 'block') {
      closeMobileMenu();
    }
  });
}

// Run when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileNav);
} else {
  // DOM already loaded, run immediately
  initMobileNav();
}

// Add a backup initialization after a brief delay to ensure all elements are loaded
window.addEventListener('load', () => {
  setTimeout(initMobileNav, 100);
});

