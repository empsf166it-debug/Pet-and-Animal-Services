/* ===== GroomPaws main script ===== */
(() => {
  'use strict';

  /* ---- Booking backend config ----
     Set BOOKING_ENDPOINT to a real endpoint (e.g. Formspree "https://formspree.io/f/xxxx",
     or your own API) to submit requests. Left empty, the form runs in DEMO MODE and
     clearly tells the user their request has NOT been sent/confirmed. */
  const BOOKING_ENDPOINT = '';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* Loader */
  window.addEventListener('load', () => setTimeout(() => $('#loader')?.classList.add('hide'), 500));
  setTimeout(() => $('#loader')?.classList.add('hide'), 4000); // safety

  /* Image fallback (never show a broken image icon) */
  $$('img').forEach(img => img.addEventListener('error', () => {
    img.style.visibility = 'hidden';
    img.parentElement?.classList.add('img-fallback');
  }, { once: true }));

  /* AOS */
  if (window.AOS) AOS.init({ duration: 900, once: true, offset: 60, easing: 'ease-out-cubic' });

  /* Header + scroll spy */
  const header = $('#header');
  const links = $$('.nav-link');
  const sections = links.map(l => $(l.getAttribute('href'))).filter(Boolean);
  const onScroll = () => {
    header.classList.toggle('scrolled', scrollY > 30);
    const y = scrollY + 140;
    let current = sections[0]?.id;
    sections.forEach(s => { if (s.offsetTop <= y) current = s.id; });
    links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + current));
    $('#toTop')?.classList.toggle('opacity-0', scrollY < 600);
  };

  /* Parallax */
  const px = $$('[data-parallax]');
  let ticking = false;
  const parallax = () => {
    px.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const speed = parseFloat(el.dataset.parallax) || 0.1;
      el.style.transform = `translate3d(0, ${(r.top + r.height / 2 - innerHeight / 2) * -speed}px, 0)`;
    });
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    onScroll();
    if (!ticking) { requestAnimationFrame(parallax); ticking = true; }
  }, { passive: true });
  onScroll(); parallax();

  /* Mobile menu */
  const burger = $('#burger'), menu = $('#mobileMenu');
  const toggleMenu = (open) => {
    const isOpen = open ?? menu.classList.contains('closed');
    menu.classList.toggle('closed', !isOpen);
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };
  burger.addEventListener('click', () => toggleMenu());
  $$('#mobileMenu a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));
  window.addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });
  window.addEventListener('resize', () => { if (innerWidth >= 1280) toggleMenu(false); });

  /* Counters */
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target, end = +el.dataset.count, dur = 1800, t0 = performance.now();
    const step = t => {
      const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * e).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    io.unobserve(el);
  }), { threshold: .5 });
  $$('[data-count]').forEach(el => io.observe(el));

  /* Service cards tap support */
  $$('.svc-card').forEach(c => c.addEventListener('click', () => c.classList.toggle('open')));

  /* Before/after sliders */
  $$('.ba').forEach(ba => {
    const r = $('input', ba);
    const set = v => ba.style.setProperty('--pos', v + '%');
    r.addEventListener('input', () => set(r.value));
    set(r.value);
  });

  /* Gallery filters */
  $$('.filter-btn').forEach(btn => btn.addEventListener('click', () => {
    $$('.filter-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
    btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
    const f = btn.dataset.filter;
    $$('.gal-item').forEach(it => {
      const show = f === 'all' || it.dataset.cat.split(' ').includes(f);
      it.classList.toggle('hidden-item', !show);
      it.classList.remove('fade-in');
      if (show) { void it.offsetWidth; it.classList.add('fade-in'); }
    });
  }));

  /* 3D tilt (pointer devices only) */
  if (matchMedia('(hover:hover)').matches) {
    $$('.tilt').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `perspective(900px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg)`;
      });
      card.addEventListener('mouseleave', () => card.style.transform = '');
    });
  }

  /* Testimonial carousel */
  const track = $('#tTrack');
  if (track) {
    const slides = $$('.t-slide', track), dotsWrap = $('#tDots');
    let i = 0, timer;
    slides.forEach((_, k) => {
      const d = document.createElement('button');
      d.className = 't-dot'; d.setAttribute('aria-label', `Show testimonial ${k + 1}`);
      d.addEventListener('click', () => { go(k); restart(); });
      dotsWrap.appendChild(d);
    });
    const go = k => {
      i = (k + slides.length) % slides.length;
      track.style.transform = `translateX(-${i * 100}%)`;
      $$('.t-dot', dotsWrap).forEach((d, n) => d.classList.toggle('active', n === i));
      slides.forEach((s, n) => s.setAttribute('aria-hidden', n !== i));
    };
    const restart = () => { clearInterval(timer); timer = setInterval(() => go(i + 1), 6000); };
    $('#tPrev').addEventListener('click', () => { go(i - 1); restart(); });
    $('#tNext').addEventListener('click', () => { go(i + 1); restart(); });
    let sx = null;
    track.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
    track.addEventListener('touchend', e => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) { go(i + (dx < 0 ? 1 : -1)); restart(); }
      sx = null;
    });
    track.parentElement.addEventListener('mouseenter', () => clearInterval(timer));
    track.parentElement.addEventListener('mouseleave', restart);
    go(0); restart();
  }

  /* "Book this package" / service prefill */
  $$('[data-package]').forEach(b => b.addEventListener('click', () => {
    const sel = $('#package'); if (sel) sel.value = b.dataset.package;
  }));
  $$('[data-service]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const sel = $('#service'); if (sel) sel.value = b.dataset.service;
  }));

  /* Booking form */
  const form = $('#bookingForm');
  if (form) {
    const date = $('#date');
    const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    date.min = today.toISOString().split('T')[0];

    const rules = {
      ownerName: v => v.trim().length >= 2 || 'Please enter your full name.',
      email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.',
      phone: v => /^[+]?[\d\s()-]{7,18}$/.test(v.trim()) || 'Please enter a valid phone number.',
      petName: v => v.trim().length >= 1 || "What's your pet's name?",
      petType: v => !!v || 'Please choose a pet type.',
      breed: v => v.trim().length >= 2 || 'Please enter the breed (or "Mixed").',
      service: v => !!v || 'Please choose a service.',
      date: v => {
        if (!v) return 'Please pick a date.';
        const d = new Date(v + 'T00:00');
        if (v < date.min) return 'Please choose a future date.';
        if (d.getDay() === 0) return 'We are closed on Sundays — please pick another day.';
        return true;
      },
    };
    const showErr = (name, msg) => {
      const f = form.elements[name], e = $(`#err-${name}`);
      if (f && f.classList) f.classList.toggle('invalid', !!msg);
      if (e) e.textContent = msg || '';
    };
    const validate = name => {
      const r = rules[name](form.elements[name].value);
      showErr(name, r === true ? '' : r);
      return r === true;
    };
    Object.keys(rules).forEach(n => {
      const el = form.elements[n];
      el.addEventListener('blur', () => validate(n));
      el.addEventListener('input', () => el.classList.contains('invalid') && validate(n));
      el.addEventListener('change', () => el.classList.contains('invalid') && validate(n));
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      let ok = Object.keys(rules).map(validate).every(Boolean);
      const slot = form.querySelector('input[name="slot"]:checked');
      $('#err-slot').textContent = slot ? '' : 'Please choose a time slot.';
      if (!slot) ok = false;
      if (form.elements.website.value) return; // honeypot
      if (!ok) { form.querySelector('.invalid, #err-slot:not(:empty)')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }

      const btn = $('#submitBtn'), label = btn.innerHTML;
      btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';
      const data = Object.fromEntries(new FormData(form));
      delete data.website;
      const status = $('#formStatus');

      try {
        if (BOOKING_ENDPOINT) {
          const res = await fetch(BOOKING_ENDPOINT, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(data)
          });
          if (!res.ok) throw new Error('Server responded ' + res.status);
          showSuccess(data, false);
        } else {
          // Demo mode: nothing is sent. Keep a local copy so the user doesn't lose their details.
          localStorage.setItem('groompaws-last-request', JSON.stringify({ ...data, savedAt: new Date().toISOString() }));
          showSuccess(data, true);
        }
        form.reset();
      } catch (err) {
        status.className = 'mt-4 rounded-2xl p-4 bg-red-50 text-red-700 text-sm';
        status.innerHTML = '<i class="fa-solid fa-circle-exclamation mr-2"></i>Sorry, we couldn\'t send your request. Please try again or call us at <a class="underline" href="tel:+15551234567">+1 (555) 123-4567</a>.';
        status.hidden = false;
      } finally {
        btn.disabled = false; btn.innerHTML = label;
      }
    });

    function showSuccess(d, demo) {
      const box = $('#successBox');
      $('#successTitle').textContent = demo ? 'Request ready — demo mode' : `Request received for ${d.petName}!`;
      $('#successMsg').innerHTML = demo
        ? `This site isn't connected to a booking system yet, so <strong>your request for ${escapeHTML(d.petName)} has not been sent or confirmed</strong>. Please call <a class="underline" href="tel:+15551234567">+1 (555) 123-4567</a> to book. (Site owner: set <code>BOOKING_ENDPOINT</code> in main.js.)`
        : `Thanks, ${escapeHTML(d.ownerName)}! We've received your request for <strong>${escapeHTML(d.date)}</strong> (${escapeHTML(d.slot)}). This is <strong>not yet a confirmed appointment</strong> — our team will email or call you to confirm availability.`;
      box.hidden = false;
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      $('#formStatus').hidden = true;
    }
    $('#successClose')?.addEventListener('click', () => $('#successBox').hidden = true);
  }

  function escapeHTML(s = '') { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  /* Newsletter */
  $('#newsForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const inp = $('#newsEmail'), msg = $('#newsMsg');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(inp.value.trim())) {
      msg.textContent = 'Please enter a valid email.'; msg.className = 'text-xs mt-2 text-[#FFD6C2]'; return;
    }
    msg.textContent = 'Thanks! (Demo: newsletter service not yet connected.)';
    msg.className = 'text-xs mt-2 text-[#BFE5D0]'; inp.value = '';
  });

  $('#year').textContent = new Date().getFullYear();
})();
