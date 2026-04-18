/* ═══════════════════════════════════════════════
   KACI STUDIO — Chrome (Nav + Footer injection)
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

  /* ── Nav ── */
  function nav(activePage) {
    const slot = document.getElementById('nav-slot');
    if (!slot) return;

    /* Logo */
    const logo = el('a', { cls: 'kaci-nav-logo', href: 'index.html', 'aria-label': 'KACI Studio home' });
    logo.appendChild(document.createTextNode('KACI\u00a0'));
    logo.appendChild(el('span', { text: 'Studio' }));

    /* Desktop links */
    const linkRow = el('div', { cls: 'kaci-nav-links' });
    PAGES.forEach(p => {
      const cls = ['kaci-nav-link', p.cta ? 'kaci-nav-cta' : '', p.id === activePage ? 'is-active' : ''].filter(Boolean).join(' ');
      const a = el('a', { cls, href: p.href });
      a.textContent = p.label + (p.cta ? ' \u2192' : '');
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
    const closeBtn   = el('button', { cls: 'kaci-mobile-close', 'aria-label': 'Close menu', text: '\u00d7' });
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

    /* Brand */
    const brand = el('div', { cls: 'kaci-footer-brand' });
    brand.appendChild(document.createTextNode('KACI\u00a0'));
    brand.appendChild(el('span', { text: 'Studio' }));

    /* Footer nav */
    const footerNav = el('nav', { cls: 'kaci-footer-links', 'aria-label': 'Footer navigation' });
    PAGES.forEach(p => footerNav.appendChild(el('a', { href: p.href, text: p.label })));

    const top = el('div', { cls: 'kaci-footer-top' });
    top.appendChild(brand);
    top.appendChild(footerNav);

    /* Copy */
    const copy = el('span', { cls: 'kaci-footer-copy' });
    copy.textContent = '\u00a9 ' + year + ' KACI Studio \u00b7 Singapore \ud83c\uddf8\ud83c\uddec \u00b7 hello.kacistudio@gmail.com';

    /* De Makers Space credit — required on every page */
    const credit = el('p', { cls: 'kaci-footer-credit' });
    credit.appendChild(document.createTextNode('Website by\u00a0'));
    const creditLink = el('a', {
      href: 'https://www.instagram.com/de.makers.space/',
      target: '_blank',
      rel: 'noopener noreferrer',
      text: 'De Makers Space',
    });
    credit.appendChild(creditLink);

    const bottom = el('div', { cls: 'kaci-footer-bottom' });
    bottom.appendChild(copy);
    bottom.appendChild(credit);

    const footerEl = el('footer', { cls: 'kaci-footer', role: 'contentinfo' });
    footerEl.appendChild(top);
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
