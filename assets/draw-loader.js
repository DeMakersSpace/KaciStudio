(function () {
  'use strict';

  var current = document.currentScript;
  var draw = current && current.getAttribute('data-draw');
  if (!draw) return;

  var files = {
    hero: 'assets/hero-draw.js',
    about: 'assets/about-draw.js',
    services: 'assets/services-draw.js',
    work: 'assets/work-draw.js',
    contact: 'assets/contact-draw.js'
  };

  var drawSrc = files[draw];
  if (!drawSrc) return;

  var libraries = [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/vivus/0.4.6/vivus.min.js',
      integrity: 'sha384-H2/JUQ2ozWNVrMrubXyimhDIGYpdzhYNhsR90WosBU5Iq1GilD0bTJ0+5jgXW+zq'
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/opentype.js/1.3.4/opentype.min.js',
      integrity: 'sha384-3TaxGqyHrMuRIWY5Z5WHNIzgNRqGIUJE+mk6tm+g1wkm9Ux2kUyOLfy9AsNWXA6u'
    }
  ];

  function loadScript(config) {
    return new Promise(function (resolve) {
      var script = document.createElement('script');
      script.src = typeof config === 'string' ? config : config.src;
      script.async = false;
      script.crossOrigin = 'anonymous';
      script.referrerPolicy = 'no-referrer';
      if (config.integrity) script.integrity = config.integrity;
      script.onload = resolve;
      script.onerror = resolve;
      document.head.appendChild(script);
    });
  }

  function start() {
    libraries.reduce(function (chain, lib) {
      return chain.then(function () { return loadScript(lib); });
    }, Promise.resolve()).then(function () {
      return loadScript(drawSrc);
    });
  }

  function schedule() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(start, { timeout: 1600 });
    } else {
      setTimeout(start, 350);
    }
  }

  if (document.readyState === 'complete') {
    schedule();
  } else {
    window.addEventListener('load', schedule, { once: true });
  }
}());
