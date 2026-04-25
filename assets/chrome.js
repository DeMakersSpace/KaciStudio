/* ═══════════════════════════════════════════════
   KACISTUDIO — Chrome (Nav + Footer injection)
   KaciChrome.nav(page)  → injects pill nav
   KaciChrome.footer()   → injects footer
   All DOM built with createElement/textContent
   (no innerHTML with dynamic data — XSS safe)
═══════════════════════════════════════════════ */

const KaciChrome = (() => {

  const PAGES = [
    { id: 'home',     label: 'Home',     href: 'index.html'    },
    { id: 'about',    label: 'About',    href: 'about.html'    },
    { id: 'services', label: 'Services', href: 'services.html' },
    { id: 'work',     label: 'Work',     href: 'work.html'     },
    { id: 'contact',  label: 'Contact',  href: 'contact.html', cta: true },
  ];

  /* ── Helpers ── */
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'cls') node.className = v;
      else if (k === 'text') node.textContent = v;
      else node.setAttribute(k, v);
    });
    children.forEach(c => c && node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return node;
  }

  /* ── Availability Banner ── */
  function banner() {
    if (sessionStorage.getItem('kaci-banner-dismissed') === '1') return;

    const bannerEl = el('div', { cls: 'kaci-banner', id: 'kaci-banner' });

    bannerEl.appendChild(document.createTextNode('Now accepting 2 brands for Q3 2026 — '));
    const link = el('a', { href: 'contact.html' });
    link.textContent = 'Apply here →';
    bannerEl.appendChild(link);

    const closeBtn = el('button', { cls: 'kaci-banner-close', 'aria-label': 'Dismiss banner' });
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => {
      bannerEl.style.display = 'none';
      sessionStorage.setItem('kaci-banner-dismissed', '1');
    });
    bannerEl.appendChild(closeBtn);

    const navSlot = document.getElementById('nav-slot');
    if (navSlot) navSlot.parentNode.insertBefore(bannerEl, navSlot);
  }

  /* ── Nav ── */
  function nav(activePage) {
    banner();
    const slot = document.getElementById('nav-slot');
    if (!slot) return;

    /* Logo */
    const logo = el('a', { cls: 'kaci-nav-logo', href: 'index.html', 'aria-label': 'KACISTUDIO home' });
    logo.appendChild(document.createTextNode('KACISTUDIO'));

    /* Desktop links */
    const linkRow = el('div', { cls: 'kaci-nav-links' });
    PAGES.forEach(p => {
      const cls = ['kaci-nav-link', p.cta ? 'kaci-nav-cta' : '', p.id === activePage ? 'is-active' : ''].filter(Boolean).join(' ');
      const a = el('a', { cls, href: p.href });
      a.textContent = p.label + (p.cta ? ' →' : '');
      linkRow.appendChild(a);
    });

    /* Hamburger */
    const burger = el('button', { cls: 'kaci-nav-hamburger', 'aria-label': 'Open menu', 'aria-expanded': 'false' });
    burger.appendChild(el('span', {}));
    burger.appendChild(el('span', {}));
    burger.appendChild(el('span', {}));

    /* Nav element */
    const navEl = el('nav', { cls: 'kaci-nav', 'aria-label': 'Main navigation' });
    navEl.appendChild(logo);
    navEl.appendChild(linkRow);
    navEl.appendChild(burger);

    /* Mobile menu */
    const mobileMenu = el('div', { cls: 'kaci-mobile-menu', id: 'kaci-mobile-menu', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Navigation' });
    const closeBtn   = el('button', { cls: 'kaci-mobile-close', 'aria-label': 'Close menu', text: '×' });
    const mobileNav  = el('nav', { cls: 'kaci-mobile-links' });

    PAGES.forEach(p => {
      const cls = ['kaci-mobile-link', p.id === activePage ? 'is-active' : ''].filter(Boolean).join(' ');
      mobileNav.appendChild(el('a', { cls, href: p.href, text: p.label }));
    });

    mobileMenu.appendChild(closeBtn);
    mobileMenu.appendChild(mobileNav);

    slot.appendChild(navEl);
    slot.appendChild(mobileMenu);

    _initMobileMenu(burger, mobileMenu, closeBtn);
  }

  /* ── Footer ── */
  function footer() {
    const slot = document.getElementById('footer-slot');
    if (!slot) return;

    const year = new Date().getFullYear();

    /* Brand wordmark + sub-label */
    const brand = el('div', { cls: 'kaci-footer-brand' });
    brand.appendChild(document.createTextNode('KACI'));
    brand.appendChild(el('span', { text: 'STUDIO' }));
    const brandWrap = el('div', { cls: 'kaci-footer-brand-wrap' });
    brandWrap.appendChild(brand);
    brandWrap.appendChild(el('div', { cls: 'kaci-footer-brand-sub', text: 'Singapore · Est. 2024' }));

    /* Footer nav */
    const footerNav = el('nav', { cls: 'kaci-footer-links', 'aria-label': 'Footer navigation' });
    PAGES.forEach(p => footerNav.appendChild(el('a', { href: p.href, text: p.label })));

    const top = el('div', { cls: 'kaci-footer-top' });
    top.appendChild(brandWrap);
    top.appendChild(footerNav);

    /* Social links bar */
    const social = el('div', { cls: 'kaci-footer-social' });
    social.appendChild(el('a', { cls: 'kaci-footer-social-link', href: 'https://www.instagram.com/kacistudio.co', target: '_blank', rel: 'noopener noreferrer', text: 'IG · @kacistudio.co' }));
    social.appendChild(el('span', { cls: 'kaci-footer-social-sep', text: '·' }));
    social.appendChild(el('a', { cls: 'kaci-footer-social-link', href: 'https://www.tiktok.com/@kacistudio', target: '_blank', rel: 'noopener noreferrer', text: 'TT · @kacistudio' }));
    social.appendChild(el('span', { cls: 'kaci-footer-social-sep', text: '·' }));
    social.appendChild(el('a', { cls: 'kaci-footer-social-link', href: 'mailto:hello.kacistudio@gmail.com', text: 'hello.kacistudio@gmail.com' }));

    /* Tagline */
    const tagline = el('p', { cls: 'kaci-footer-tagline', text: 'Crafted with Soul. Created to Connect.' });

    /* Copyright */
    const copy = el('span', { cls: 'kaci-footer-copy' });
    copy.textContent = '© ' + year + ' KACISTUDIO · Singapore 🇸🇬';

    /* De Makers Space credit — required on every page */
    const credit = el('p', { cls: 'kaci-footer-credit' });
    credit.appendChild(document.createTextNode('Website by '));
    credit.appendChild(el('a', {
      href: 'https://www.instagram.com/de.makers.space/',
      target: '_blank',
      rel: 'noopener noreferrer',
      text: 'De Makers Space',
    }));

    const bottom = el('div', { cls: 'kaci-footer-bottom' });
    bottom.appendChild(copy);
    bottom.appendChild(credit);

    const footerEl = el('footer', { cls: 'kaci-footer', role: 'contentinfo' });
    footerEl.appendChild(top);
    footerEl.appendChild(social);
    footerEl.appendChild(tagline);
    footerEl.appendChild(bottom);

    slot.appendChild(footerEl);
  }

  /* ── Mobile menu logic ── */
  function _initMobileMenu(hamburger, menu, closeBtn) {
    function openMenu() {
      menu.classList.add('is-open');
      document.body.classList.add('nav-locked');
      hamburger.setAttribute('aria-expanded', 'true');
    }
    function closeMenu() {
      menu.classList.remove('is-open');
      document.body.classList.remove('nav-locked');
      hamburger.setAttribute('aria-expanded', 'false');
    }
    hamburger.addEventListener('click', openMenu);
    closeBtn.addEventListener('click', closeMenu);
    menu.addEventListener('click', e => { if (e.target === menu) closeMenu(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  }

  return { nav, footer };

})();
