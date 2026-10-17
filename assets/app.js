/* Morrowgrain — navigation, media preferences and enquiry handling. */
(() => {
  'use strict';
  const doc = document;
  const config = window.MORROWGRAIN_CONFIG || {};
  const $ = (selector, parent = doc) => parent.querySelector(selector);
  const $$ = (selector, parent = doc) => [...parent.querySelectorAll(selector)];
  const systemMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionKey = 'morrowgrain-reduce-motion';
  let userReduced = false;
  try { userReduced = localStorage.getItem(motionKey) === 'true'; } catch (_) { /* Private/file browsing may deny storage. */ }
  let reduced = systemMotion.matches || userReduced;
  const video = $('[data-hero-video]');
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  let videoVisible = true;

  function playFilm() {
    if (!video || reduced || saveData || !videoVisible || doc.hidden) return;
    if (!video.getAttribute('src')) {
      // Configure the local film in site-config.js.
      video.src = config.heroVideo || video.dataset.source;
      video.muted = true;
      video.load();
    }
    const playing = video.play();
    if (playing && playing.catch) playing.catch(() => {
      // Autoplay can be blocked by battery-saving browsers. The poster remains.
      video.classList.remove('is-playing');
    });
  }
  function updateMotion() {
    reduced = systemMotion.matches || userReduced;
    doc.documentElement.classList.toggle('motion-reduced', reduced);
    $$('[data-motion-toggle]').forEach(button => {
      button.setAttribute('aria-pressed', String(reduced));
      button.textContent = systemMotion.matches ? 'Reduced motion · device setting' : reduced ? 'Reduced motion on' : 'Reduce motion';
      button.disabled = systemMotion.matches;
    });
    if (reduced) {
      if (video) { video.pause(); video.classList.remove('is-playing'); }
      $$('[data-parallax]').forEach(item => { item.style.transform = ''; });
      $$('.reveal-ready').forEach(item => item.classList.add('is-revealed'));
    } else { playFilm(); }
  }
  $$('[data-motion-toggle]').forEach(button => button.addEventListener('click', () => {
    userReduced = !userReduced;
    try { localStorage.setItem(motionKey, String(userReduced)); } catch (_) { /* Optional preference only. */ }
    updateMotion();
  }));
  if (systemMotion.addEventListener) systemMotion.addEventListener('change', updateMotion);
  else if (systemMotion.addListener) systemMotion.addListener(updateMotion);
  if (video) {
    video.addEventListener('playing', () => { if (!reduced) video.classList.add('is-playing'); });
    video.addEventListener('error', () => video.classList.remove('is-playing'));
    if ('IntersectionObserver' in window) {
      const filmObserver = new IntersectionObserver(entries => {
        videoVisible = entries[0].isIntersecting;
        if (videoVisible) playFilm(); else video.pause();
      }, { threshold: 0.05 });
      filmObserver.observe(video);
    }
    doc.addEventListener('visibilitychange', () => { if (doc.hidden) video.pause(); else playFilm(); });
  }
  updateMotion();

  // Accessible mobile navigation: Escape, focus containment and focus return.
  const menu = $('#mobile-menu');
  const menuTrigger = $('[data-menu-trigger]');
  const closeMenuButton = $('[data-menu-close]');
  let menuWasOpened = false;
  let previousFocus;
  function closeMenu() {
    if (!menu || !menuWasOpened) return;
    menu.hidden = true;
    doc.body.classList.remove('menu-open');
    menuTrigger.setAttribute('aria-expanded', 'false');
    $$('[data-menu-inert]').forEach(item => { item.inert = false; });
    menuWasOpened = false;
    if (previousFocus && previousFocus.focus) previousFocus.focus();
  }
  if (menu && menuTrigger && closeMenuButton) {
    menuTrigger.addEventListener('click', () => {
      previousFocus = doc.activeElement;
      menu.hidden = false;
      menuWasOpened = true;
      doc.body.classList.add('menu-open');
      menuTrigger.setAttribute('aria-expanded', 'true');
      $$('[data-menu-inert]').forEach(item => { item.inert = true; });
      closeMenuButton.focus();
    });
    closeMenuButton.addEventListener('click', closeMenu);
    menu.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); closeMenu(); }
      if (event.key !== 'Tab') return;
      const items = $$('a[href], button:not([disabled])', menu);
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && doc.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && doc.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    $$('a', menu).forEach(link => link.addEventListener('click', closeMenu));
    window.addEventListener('resize', () => { if (window.innerWidth > 800) closeMenu(); }, { passive: true });
  }

  // Quiet image reveals. Essential text never depends on an observer.
  if ('IntersectionObserver' in window && !reduced) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    $$('[data-reveal]').forEach(item => { item.classList.add('reveal-ready'); observer.observe(item); });
  }
  const parallaxItems = $$('[data-parallax]');
  let scrollPending = false;
  function paintParallax() {
    scrollPending = false;
    if (reduced || window.innerWidth < 600) return;
    parallaxItems.forEach(item => {
      const amount = Math.min(window.scrollY * 0.065, 30);
      item.style.transform = `translate3d(0, ${amount}px, 0) scale(1.055)`;
    });
  }
  if (parallaxItems.length) window.addEventListener('scroll', () => {
    if (!scrollPending) { scrollPending = true; requestAnimationFrame(paintParallax); }
  }, { passive: true });

  // Work archive: filter real HTML items, with an announced result count.
  const filters = $$('[data-filter]');
  const pieces = $$('[data-category]');
  const resultCount = $('[data-result-count]');
  filters.forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    let count = 0;
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    pieces.forEach(piece => {
      const visible = filter === 'all' || piece.dataset.category === filter;
      piece.hidden = !visible;
      if (visible) { count++; piece.querySelectorAll('.reveal-ready').forEach(item => item.classList.add('is-revealed')); }
    });
    if (resultCount) resultCount.textContent = `${count} ${count === 1 ? 'piece' : 'pieces'}`;
  }));

  const materials = {
    oak: {title: 'Oak, with its history intact.', description: 'Dense, characterful and often full of old nail marks. A former beam can become a generous table top, with the sound grain kept and the softer areas worked around.', image: 'assets/images/oak-table.jpg', alt: 'An oak-toned dining table with a natural wood surface.'},
    pine: {title: 'Pine that feels like home.', description: 'Warm, lighter timber with a useful softness. Old floorboards lend themselves to shelves and smaller pieces; dents can stay when they belong to the story.', image: 'assets/images/shelving.jpg', alt: 'Light wood shelving in a sunlit home study.'},
    mixed: {title: 'A little of everything.', description: 'A door, an offcut, an inherited piece with one good panel left. We start with what is sound, then design a piece around the timber you actually have.', image: 'assets/images/bench.jpg', alt: 'A rustic wooden bench with an uneven, characterful timber surface.'}
  };
  $$('[data-material]').forEach(button => button.addEventListener('click', () => {
    const material = materials[button.dataset.material];
    if (!material) return;
    $$('[data-material]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    $('[data-material-title]').textContent = material.title;
    $('[data-material-description]').textContent = material.description;
    const photo = $('[data-material-photo]');
    photo.src = material.image;
    photo.alt = material.alt;
  }));

  // Illustrative quotes, changed only when the visitor asks.
  const quotes = [
    {text: '“We wanted to keep something from the old house. Now it’s the table we sit around every evening.”', name: 'Clara & Ben', detail: 'Illustrative client words · a family table'},
    {text: '“They kept the little marks we loved, and made a bench that finally fits our hallway.”', name: 'Anika', detail: 'Illustrative client words · a hallway bench'},
    {text: '“The shelves feel like they’ve always belonged here. That’s exactly what we hoped for.”', name: 'Sam & Jules', detail: 'Illustrative client words · a quiet study'}
  ];
  let quoteIndex = 0;
  function showQuote(nextIndex) {
    quoteIndex = (nextIndex + quotes.length) % quotes.length;
    const item = quotes[quoteIndex];
    $('[data-quote-text]').textContent = item.text;
    $('[data-quote-name]').textContent = item.name;
    $('[data-quote-detail]').textContent = item.detail;
    $('[data-quote-count]').textContent = `${quoteIndex + 1} / ${quotes.length}`;
  }
  const previousQuote = $('[data-quote-prev]'), nextQuote = $('[data-quote-next]');
  if (previousQuote && nextQuote) {
    previousQuote.addEventListener('click', () => showQuote(quoteIndex - 1));
    nextQuote.addEventListener('click', () => showQuote(quoteIndex + 1));
  }

  // Review and export enquiries before optional delivery.
  const form = $('#commission-form');
  const review = $('#enquiry-review');
  if (form && review) {
    $('[data-form-submit]', form).disabled = false;
    let enquiryText = '', enquiryData = null, enquiryPreparedAt = 0;
    const status = $('#form-status');
    const reviewStatus = $('#review-status');
    const endpoint = typeof config.formEndpoint === 'string' && /^https:\/\//i.test(config.formEndpoint) ? config.formEndpoint : '';
    const email = typeof config.contactEmail === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.contactEmail) ? config.contactEmail : '';
    const delivery = $('#deliver-enquiry');
    const emailLink = $('#email-enquiry');
    const requiredFields = ['name', 'email', 'piece', 'story'];
    function setStatus(element, text, error = false) {
      element.hidden = !text;
      element.textContent = text;
      element.classList.toggle('is-error', error);
    }
    function clearError(field) {
      field.removeAttribute('aria-invalid');
      const message = $(`#${field.id}-error`);
      if (message) { message.textContent = ''; message.hidden = true; }
    }
    requiredFields.forEach(name => {
      const field = form.elements.namedItem(name);
      field.addEventListener('input', () => clearError(field));
      field.addEventListener('change', () => clearError(field));
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      let invalid = null;
      requiredFields.forEach(name => {
        const field = form.elements.namedItem(name);
        clearError(field);
        let message = '';
        if (!field.value.trim()) message = name === 'piece' ? 'Please choose the kind of piece you have in mind.' : `Please add your ${name === 'story' ? 'timber story or idea' : name}.`;
        else if (name === 'email' && !field.validity.valid) message = 'Please enter a complete email address.';
        if (message) {
          field.setAttribute('aria-invalid', 'true');
          const error = $(`#${field.id}-error`);
          error.textContent = message; error.hidden = false;
          if (!invalid) invalid = field;
        }
      });
      if (invalid) {
        setStatus(status, 'A few details are missing. Please check the fields below.', true);
        invalid.focus(); return;
      }
      setStatus(status, '');
      setStatus(reviewStatus, '');
      const data = new FormData(form);
      enquiryData = {
        name: String(data.get('name')).trim(), email: String(data.get('email')).trim(),
        location: String(data.get('location') || '').trim(), piece: String(data.get('piece')),
        timber: String(data.get('timber') || 'Not sure yet'),
        story: String(data.get('story')).trim(), timing: String(data.get('timing') || 'Flexible'),
        website: String(data.get('website') || '')
      };
      enquiryPreparedAt = Date.now();
      // Use textContent for user input, never HTML.
      enquiryText = `A Morrowgrain commission\n\nName: ${enquiryData.name}\nEmail: ${enquiryData.email}\nLocation: ${enquiryData.location || 'Not provided'}\nPiece: ${enquiryData.piece}\nTimber: ${enquiryData.timber}\nTiming: ${enquiryData.timing}\n\nThe story & idea\n${enquiryData.story}\n\nPrepared on ${new Date().toLocaleDateString('en-GB')}\n`;
      $('#enquiry-summary').textContent = enquiryText;
      delivery.hidden = !endpoint;
      emailLink.hidden = !email || !!endpoint;
      if (email) emailLink.href = `mailto:${email}?subject=${encodeURIComponent('A Morrowgrain commission')}&body=${encodeURIComponent(enquiryText)}`;
      $('#delivery-note').textContent = endpoint ? 'Check your details, then send your enquiry to the workshop.' : email ? 'Open your email app to send your enquiry, or keep a copy for yourself.' : 'Your enquiry is ready to save or copy. Nothing has been sent.';
      form.hidden = true; review.hidden = false;
      $('#review-title').focus();
      review.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
    });
    $('#edit-enquiry').addEventListener('click', () => {
      review.hidden = true; form.hidden = false;
      form.elements.namedItem('name').focus();
    });
    $('#download-enquiry').addEventListener('click', () => {
      const file = new Blob([enquiryText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(file);
      const link = doc.createElement('a');
      link.href = url; link.download = 'morrowgrain-enquiry.txt';
      doc.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus(reviewStatus, 'Your enquiry file is ready. Keep it somewhere handy.');
    });
    $('#copy-enquiry').addEventListener('click', async () => {
      try {
        if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(enquiryText);
        setStatus(reviewStatus, 'Enquiry copied. You can paste it into a message or email.');
      } catch (_) {
        // file:// may not grant clipboard access. Offer a keyboard selection.
        const selection = window.getSelection();
        const range = doc.createRange();
        range.selectNodeContents($('#enquiry-summary'));
        selection.removeAllRanges(); selection.addRange(range);
        setStatus(reviewStatus, 'Your enquiry is selected. Use Ctrl+C or ⌘C to copy, or choose Save enquiry.');
      }
    });
    delivery.addEventListener('click', async () => {
      if (!endpoint || !enquiryData) return;
      delivery.disabled = true; delivery.textContent = 'Sending…';
      setStatus(reviewStatus, '');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        if (enquiryData.website) throw new Error('Unable to send');
        const response = await fetch(endpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ ...enquiryData, preparedAt: enquiryPreparedAt }), signal: controller.signal,
          credentials: 'omit', referrerPolicy: 'no-referrer'
        });
        if (!response.ok) throw new Error('Delivery not accepted');
        setStatus(reviewStatus, 'Your enquiry has been sent. Thank you for sharing its story.');
        delivery.hidden = true;
        $('#delivery-note').textContent = 'Keep a copy of your enquiry below.';
      } catch (_) {
        setStatus(reviewStatus, 'Your enquiry could not be sent. Your details are still here; try again or save a copy.', true);
      } finally {
        clearTimeout(timeout); delivery.disabled = false; delivery.textContent = 'Send enquiry';
      }
    });
  }
})();
