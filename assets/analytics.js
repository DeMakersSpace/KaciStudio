(function () {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  var analyticsLoaded = false;

  function loadAnalytics() {
    if (analyticsLoaded) return;
    analyticsLoaded = true;

    window.gtag('js', new Date());
    window.gtag('config', 'G-MH6S397YFH');

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-MH6S397YFH';
    document.head.appendChild(script);
  }

  function scheduleAnalytics() {
    var fallbackTimer = window.setTimeout(loadAnalytics, 10000);
    var intentEvents = ['pointerdown', 'keydown', 'scroll'];

    function loadOnFirstIntent() {
      window.clearTimeout(fallbackTimer);
      loadAnalytics();
      intentEvents.forEach(function (eventName) {
        window.removeEventListener(eventName, loadOnFirstIntent);
      });
    }

    window.addEventListener('pointerdown', loadOnFirstIntent, { once: true, passive: true });
    window.addEventListener('keydown', loadOnFirstIntent, { once: true });
    window.addEventListener('scroll', loadOnFirstIntent, { once: true, passive: true });
  }

  if (document.readyState === 'complete') scheduleAnalytics();
  else window.addEventListener('load', scheduleAnalytics, { once: true });
})();
