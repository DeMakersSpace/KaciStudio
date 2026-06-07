(function () {
  // Title parts: array of {text}, {br}, or {em} nodes — built safely via DOM
  var items = [
    {
      num: '01',
      titleParts: [{ text: 'Small team,' }, { br: true }, { em: 'big focus.' }],
      desc: 'We cap our roster at two new brands per quarter. The person on your discovery call is the same person editing your reels — no account managers, no handoffs.'
    },
    {
      num: '02',
      titleParts: [{ text: 'Story-first content,' }, { br: true }, { em: 'always.' }],
      desc: "Every piece of content is written by humans who know your brand. No AI captions, no trending-audio cosplay, no recycled templates. If it doesn't say something, it doesn't get made."
    },
    {
      num: '03',
      titleParts: [{ text: 'A true ' }, { em: 'creative partner.' }],
      desc: 'We work as an extension of your team — strategy to storyboard to shoot day to final post. Month-to-month, so we earn your trust every cycle instead of locking it in.'
    }
  ];

  var active = 0;
  var timer  = null;
  var n      = items.length;

  var wrap    = document.getElementById('whyImagesWrap');
  var numEl   = document.getElementById('whyActiveNum');
  var titleEl = document.getElementById('whyActiveTitle');
  var descEl  = document.getElementById('whyActiveDesc');
  var inner   = document.getElementById('whyActiveContent');
  var prevBtn = document.getElementById('whyPrev');
  var nextBtn = document.getElementById('whyNext');

  if (!wrap) return;

  var imgs = Array.from(wrap.querySelectorAll('.why-img'));

  function buildTitle(parts) {
    var frag = document.createDocumentFragment();
    parts.forEach(function (part) {
      if (part.br) {
        frag.appendChild(document.createElement('br'));
      } else if (part.em) {
        var em = document.createElement('em');
        em.textContent = part.em;
        frag.appendChild(em);
      } else {
        frag.appendChild(document.createTextNode(part.text));
      }
    });
    return frag;
  }

  function animateWords(text) {
    while (descEl.firstChild) descEl.removeChild(descEl.firstChild);
    text.split(' ').forEach(function (word, i) {
      var span = document.createElement('span');
      span.className = 'why-word';
      span.textContent = word;
      span.style.animationDelay = (i * 0.028) + 's';
      descEl.appendChild(span);
      descEl.appendChild(document.createTextNode(' '));
    });
  }

  function getTransform(index) {
    var w    = wrap.offsetWidth;
    var gap  = Math.min(86, Math.max(60, w * 0.065));
    var rise = gap * 0.8;
    var isLeft  = (active - 1 + n) % n === index;
    var isRight = (active + 1) % n === index;

    if (index === active) {
      return { t: 'translateX(0) translateY(0) scale(1) rotateY(0deg)', o: 1, z: 3 };
    }
    if (isLeft) {
      return { t: 'translateX(-' + gap + 'px) translateY(-' + rise + 'px) scale(0.85) rotateY(15deg)', o: 1, z: 2 };
    }
    if (isRight) {
      return { t: 'translateX(' + gap + 'px) translateY(-' + rise + 'px) scale(0.85) rotateY(-15deg)', o: 1, z: 2 };
    }
    return { t: 'scale(0.7)', o: 0, z: 1 };
  }

  function applyTransforms() {
    imgs.forEach(function (img, i) {
      var s = getTransform(i);
      img.style.transform = s.t;
      img.style.opacity   = s.o;
      img.style.zIndex    = s.z;
    });
  }

  function goTo(index) {
    active = ((index % n) + n) % n;
    var item = items[active];

    inner.classList.add('fading');

    setTimeout(function () {
      numEl.textContent = item.num;
      while (titleEl.firstChild) titleEl.removeChild(titleEl.firstChild);
      titleEl.appendChild(buildTitle(item.titleParts));
      animateWords(item.desc);
      inner.classList.remove('fading');
    }, 220);

    applyTransforms();
  }

  prevBtn && prevBtn.addEventListener('click', function () { clearInterval(timer); goTo(active - 1); });
  nextBtn && nextBtn.addEventListener('click', function () { clearInterval(timer); goTo(active + 1); });

  document.addEventListener('keydown', function (e) {
    if (!document.getElementById('whyImagesWrap')) return;
    if (e.key === 'ArrowLeft')  { clearInterval(timer); goTo(active - 1); }
    if (e.key === 'ArrowRight') { clearInterval(timer); goTo(active + 1); }
  });

  window.addEventListener('resize', applyTransforms);

  // Init
  applyTransforms();
  animateWords(items[0].desc);
  timer = setInterval(function () { goTo(active + 1); }, 5000);
})();
