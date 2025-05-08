// Mobile nav logic for Astro blog
// This script is loaded client-side via client:load

document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menu-toggle');
  const closeMenu = document.getElementById('close-menu');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = mobileMenu?.querySelectorAll('a');

  function setAriaExpanded(expanded) {
    if (menuToggle) menuToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  }

  const toggleScrollLock = (lock) => {
    document.body.style.overflow = lock ? 'hidden' : '';
  };

  menuToggle?.addEventListener('click', () => {
    if (mobileMenu && typeof mobileMenu.showModal === 'function') {
      mobileMenu.showModal();
      setAriaExpanded(true);
      toggleScrollLock(true);
      mobileMenu.focus();
    }
  });

  closeMenu?.addEventListener('click', () => {
    if (mobileMenu && typeof mobileMenu.close === 'function') {
      mobileMenu.close();
      setAriaExpanded(false);
      toggleScrollLock(false);
    }
  });

  mobileLinks?.forEach(link => {
    link.addEventListener('click', () => {
      if (mobileMenu && typeof mobileMenu.close === 'function') {
        mobileMenu.close();
        setAriaExpanded(false);
        toggleScrollLock(false);
      }
    });
  });

  mobileMenu?.addEventListener('close', () => {
    setAriaExpanded(false);
    toggleScrollLock(false);
    menuToggle?.focus();
  });

  document.addEventListener('keydown', (e) => {
    if (mobileMenu && mobileMenu.open) {
      if (e.key === 'Escape') {
        mobileMenu.close();
        setAriaExpanded(false);
        toggleScrollLock(false);
        menuToggle?.focus();
      }
    }
  });

  // Sticky header behavior
  let lastScrollTop = 0;
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (mobileMenu?.classList.contains('hidden')) {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollTop > lastScrollTop && scrollTop > 100) {
        header?.classList.add('-translate-y-full');
      } else {
        header?.classList.remove('-translate-y-full');
      }
      lastScrollTop = scrollTop;
    }
  });

  // Close mobile menu if resizing to md or larger
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768 && mobileMenu && mobileMenu.open) {
      mobileMenu.close();
      setAriaExpanded(false);
      toggleScrollLock(false);
    }
  });

  // Improve menu max height for usability
  if (mobileMenu) {
    mobileMenu.style.maxHeight = '100vh';
    mobileMenu.style.overflowY = 'auto';
  }
});
