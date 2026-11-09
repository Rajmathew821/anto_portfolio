/* =========================================================
   Antony Raj A — Portfolio interactions
   ========================================================= */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- Theme ---------- */
  const themeBtn = $('#theme-toggle');
  const themeMeta = $('meta[name="theme-color"]');

  const applyTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    if (themeMeta) themeMeta.setAttribute('content', theme === 'dark' ? '#0a0d12' : '#f6f7f9');
    if (themeBtn) themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    document.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
  };

  applyTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

  themeBtn?.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
  });

  /* ---------- Mobile navigation ---------- */
  const navToggle = $('#nav-toggle');
  const setNav = (open) => {
    document.body.classList.toggle('nav-open', open);
    navToggle?.setAttribute('aria-expanded', String(open));
    navToggle?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  navToggle?.addEventListener('click', () => setNav(!document.body.classList.contains('nav-open')));
  $$('#nav a').forEach((a) => a.addEventListener('click', () => setNav(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setNav(false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 900) setNav(false); });

  /* ---------- Header state, scroll progress, back-to-top ---------- */
  const header = $('.site-header');
  const progress = $('.scroll-progress');
  const toTop = $('#to-top');
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    header?.classList.toggle('scrolled', y > 10);
    if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
    toTop?.classList.toggle('visible', y > 700);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  toTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  /* ---------- Active nav link (scroll spy) ---------- */
  const navLinks = new Map($$('.nav-link').map((a) => [a.getAttribute('href').slice(1), a]));
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => link.classList.remove('active'));
        navLinks.get(entry.target.id)?.classList.add('active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((s) => spy.observe(s));
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('in'));
  } else {
    const revealer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => revealer.observe(el));
  }

  /* ---------- Typing effect ---------- */
  const typed = $('#typed');
  const roles = ['AI / ML Engineer', 'Agentic AI Developer', 'LLM & RAG Engineer', 'Python Backend Engineer'];
  if (typed && !reduceMotion) {
    let roleIdx = 0;
    let charIdx = roles[0].length;
    let deleting = true;
    const tick = () => {
      const word = roles[roleIdx];
      charIdx += deleting ? -1 : 1;
      typed.textContent = word.slice(0, charIdx);
      let delay = deleting ? 38 : 80;
      if (!deleting && charIdx === word.length) {
        deleting = true;
        delay = 2000;
      } else if (deleting && charIdx === 0) {
        deleting = false;
        roleIdx = (roleIdx + 1) % roles.length;
        delay = 380;
      }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 2600);
  }

  /* ---------- Count-up stats ---------- */
  const counters = $$('[data-count]');
  const countUp = (el) => {
    const target = Number(el.dataset.count);
    const duration = 1500;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (!reduceMotion && 'IntersectionObserver' in window) {
    counters.forEach((el) => { el.textContent = '0'; });
    const counterObs = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => counterObs.observe(el));
  }

  /* ---------- OpenSRE pipeline animation ---------- */
  const pipeline = $('.pipeline');
  if (pipeline && !reduceMotion) {
    const steps = $$('.pipe-step', pipeline);
    const status = $('.pipeline-status');
    const statusText = $('#pipeline-status-text');
    const messages = [
      'detecting anomaly…',
      'investigating signals…',
      'analysing root cause…',
      'planning remediation…',
      'executing playbook…',
      'verifying health…',
      'node healthy'
    ];
    let idx = 0;
    let timer = null;

    const render = () => {
      steps.forEach((s, k) => {
        s.classList.toggle('done', k < idx);
        s.classList.toggle('active', k === idx);
      });
      const finished = idx >= steps.length;
      status?.classList.toggle('working', !finished);
      if (statusText) statusText.textContent = messages[Math.min(idx, messages.length - 1)];
    };
    const advance = () => {
      idx = idx >= steps.length ? 0 : idx + 1;
      render();
      timer = setTimeout(advance, idx >= steps.length ? 2800 : 1300);
    };
    const startPipeline = () => { if (timer === null) { idx = 0; render(); timer = setTimeout(advance, 1300); } };
    const stopPipeline = () => { clearTimeout(timer); timer = null; };

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        entry.isIntersecting ? startPipeline() : stopPipeline();
      }, { threshold: 0.4 }).observe(pipeline);
    } else {
      startPipeline();
    }
  }

  /* ---------- Card spotlight (follows the cursor) ---------- */
  if (finePointer) {
    $$('.card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------- Copy to clipboard + toast ---------- */
  const toast = $('#toast');
  let toastTimer = null;
  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  };

  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    // Fallback for file:// or older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    if (!ok) throw new Error('copy failed');
  };

  $$('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      const use = $('use', btn);
      try {
        await copyText(text);
        showToast(`Copied: ${text}`);
        btn.classList.add('copied');
        use?.setAttribute('href', '#i-check');
        setTimeout(() => {
          btn.classList.remove('copied');
          use?.setAttribute('href', '#i-copy');
        }, 1800);
      } catch (e) {
        showToast(`Couldn't copy — ${text}`);
      }
    });
  });

  /* ---------- Footer year ---------- */
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Hero neural-network canvas ---------- */
  const canvas = $('#hero-canvas');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const hero = canvas.parentElement;
    const LINK_DIST = 140;
    const POINTER_DIST = 180;
    let w = 0;
    let h = 0;
    let nodes = [];
    let rafId = null;
    let rgb = '94, 234, 212';
    const pointer = { x: null, y: null };

    const readColor = () => {
      const v = getComputedStyle(root).getPropertyValue('--canvas-rgb').trim();
      if (v) rgb = v;
    };

    const makeNodes = () => {
      const count = Math.round(Math.min(95, Math.max(28, (w * h) / 15000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.32,
        vy: (Math.random() - 0.5) * 0.32,
        r: Math.random() * 1.4 + 0.9
      }));
    };

    const resize = () => {
      const prevW = w;
      const rect = hero.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Only reseed when width really changes (avoids reshuffling when mobile URL bar hides)
      if (!nodes.length || Math.abs(prevW - w) > 40) makeNodes();
      else nodes.forEach((n) => { n.x = Math.min(n.x, w); n.y = Math.min(n.y, h); });
    };

    const draw = (animate) => {
      ctx.clearRect(0, 0, w, h);

      if (animate) {
        for (const n of nodes) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;
        }
      }

      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK_DIST * LINK_DIST) {
            ctx.strokeStyle = `rgba(${rgb}, ${(1 - Math.sqrt(d2) / LINK_DIST) * 0.26})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        if (pointer.x !== null) {
          const d = Math.hypot(a.x - pointer.x, a.y - pointer.y);
          if (d < POINTER_DIST) {
            ctx.strokeStyle = `rgba(${rgb}, ${(1 - d / POINTER_DIST) * 0.55})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }
      }

      ctx.fillStyle = `rgba(${rgb}, 0.7)`;
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = () => { draw(true); rafId = requestAnimationFrame(loop); };
    const start = () => { if (rafId === null && !reduceMotion) rafId = requestAnimationFrame(loop); };
    const stop = () => { if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; } };

    readColor();
    resize();
    draw(false);

    document.addEventListener('themechange', () => { readColor(); if (rafId === null) draw(false); });

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { resize(); if (rafId === null) draw(false); }, 150);
    });

    if (finePointer && !reduceMotion) {
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        pointer.x = e.clientX - r.left;
        pointer.y = e.clientY - r.top;
      });
      hero.addEventListener('pointerleave', () => { pointer.x = null; pointer.y = null; });
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        entry.isIntersecting ? start() : stop();
      }).observe(hero);
    } else {
      start();
    }
  }
})();
