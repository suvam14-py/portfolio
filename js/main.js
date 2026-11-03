document.documentElement.classList.add('js-ready');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.querySelector('span').textContent = open ? '−' : '＋';
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.querySelector('span').textContent = '＋';
  }));
}
// Full-screen project story: open a project, reveal its description, then move through the set.
(() => {
  const projects = [...document.querySelectorAll('[data-project]')];
  if (!projects.length) return;

  const overlay = document.createElement('section');
  overlay.className = 'project-experience';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Selected project details');
  overlay.innerHTML = `
    <div class="experience-top"><span class="experience-count">01 / 05</span><button class="experience-close" type="button">CLOSE ×</button></div>
    <div class="experience-body"><div class="experience-visual"></div><div class="experience-copy"><p class="eyebrow experience-kind"></p><h2 class="experience-title"></h2><p class="experience-description"></p><div class="experience-detail"></div><div class="experience-controls"><span class="experience-hint">SCROLL OR USE THE ARROWS</span><div><button class="experience-prev" type="button" aria-label="Previous project">←</button><button class="experience-next" type="button" aria-label="Next project">NEXT PROJECT ↗</button></div></div></div></div>`;
  document.body.appendChild(overlay);

  let active = 0;
  let lastFocused = null;
  const $ = (selector) => overlay.querySelector(selector);

  function render(index, animate = true) {
    active = index;
    const project = projects[active];
    const visual = project.querySelector('.project-visual');
    const detail = project.querySelector('.project-detail');
    $('.experience-count').textContent = `${String(active + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}`;
    $('.experience-visual').innerHTML = '';
    const visualClone = visual.cloneNode(true);
    visualClone.removeAttribute('href');
    visualClone.setAttribute('aria-hidden', 'true');
    $('.experience-visual').appendChild(visualClone);
    $('.experience-kind').textContent = project.querySelector('.project-kind')?.textContent || 'SELECTED WORK';
    $('.experience-title').textContent = project.querySelector('h3')?.textContent || `Project ${active + 1}`;
    $('.experience-description').textContent = project.querySelector('.project-description')?.textContent || '';
    $('.experience-detail').innerHTML = detail ? detail.innerHTML : '';
    $('.experience-prev').disabled = active === 0;
    $('.experience-next').textContent = active === projects.length - 1 ? 'ABOUT ME ↘' : 'NEXT PROJECT ↗';
    overlay.classList.toggle('is-changing', animate);
    if (animate) window.setTimeout(() => overlay.classList.remove('is-changing'), 260);
  }

  function open(index) {
    lastFocused = document.activeElement;
    render(index, false);
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('project-experience-open');
    $('.experience-close').focus();
  }

  function close(goAbout = false) {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('project-experience-open');
    if (goAbout) document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' });
    else if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus({ preventScroll: true });
  }

  projects.forEach((project, index) => {
    project.querySelector('.project-visual')?.addEventListener('click', (event) => { event.preventDefault(); open(index); });
    project.querySelector('.round-arrow')?.addEventListener('click', (event) => { event.preventDefault(); open(index); });
  });
  $('.experience-close').addEventListener('click', () => close());
  $('.experience-prev').addEventListener('click', () => { if (active > 0) render(active - 1); });
  $('.experience-next').addEventListener('click', () => {
    if (active < projects.length - 1) render(active + 1);
    else close(true);
  });
  overlay.addEventListener('wheel', (event) => {
    if (Math.abs(event.deltaY) < 24) return;
    if (event.deltaY > 0 && active < projects.length - 1) { event.preventDefault(); render(active + 1); }
    else if (event.deltaY < 0 && active > 0) { event.preventDefault(); render(active - 1); }
  }, { passive: false });
  document.addEventListener('keydown', (event) => {
    if (!overlay.classList.contains('is-open')) return;
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowRight' && active < projects.length - 1) render(active + 1);
    if (event.key === 'ArrowLeft' && active > 0) render(active - 1);
  });
})();
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();


// Zoom-aware work gallery: recalculates travel at 80%, 90%, 100%, 125%, and 150% browser zoom.
(() => {
  const space = document.getElementById('work-scroll-space');
  const track = document.getElementById('project-track');
  if (!space || !track) return;

  const mobileQuery = window.matchMedia('(max-width: 760px)');
  let maxTravel = 0;
  let measureFrame = 0;
  let ticking = false;

  const viewportWidth = () => document.documentElement.clientWidth || window.innerWidth;

  function measureGallery() {
    measureFrame = 0;

    if (mobileQuery.matches) {
      space.style.height = 'auto';
      track.style.transform = 'none';
      track.querySelectorAll('.project-visual').forEach(visual => {
        visual.style.removeProperty('--visual-scale');
      });
      maxTravel = 0;
      return;
    }

    // scrollWidth includes the complete card row, even when part of it is off-screen.
    // Use the layout viewport rather than a cached width so browser zoom is respected.
    const width = viewportWidth();
    maxTravel = Math.max(0, track.scrollWidth - width);
    space.style.height = `${window.innerHeight + maxTravel}px`;
    updateGallery();
  }

  function updateGallery() {
    if (mobileQuery.matches || maxTravel <= 0) {
      track.style.transform = 'none';
      return;
    }

    const width = viewportWidth();
    const rect = space.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, maxTravel)));
    const travel = maxTravel * progress;
    track.style.transform = `translate3d(${-travel}px, 0, 0)`;

    // Keep image scaling subtle and proportional to the current viewport at any zoom.
    const cards = track.querySelectorAll('.project');
    const viewportCenter = width * 0.5;
    cards.forEach(card => {
      const visual = card.querySelector('.project-visual');
      if (!visual) return;
      const cardRect = card.getBoundingClientRect();
      const center = cardRect.left + cardRect.width * 0.5;
      const distance = Math.min(1, Math.abs(center - viewportCenter) / Math.max(1, width * 0.8));
      const arrival = Math.min(1, Math.max(0, (travel + width * 0.18) / Math.max(1, width * 0.38)));
      const scale = 1 + (0.055 * (1 - arrival) * (1 - distance));
      visual.style.setProperty('--visual-scale', scale.toFixed(3));
    });
  }

  function scheduleMeasure() {
    if (measureFrame) cancelAnimationFrame(measureFrame);
    measureFrame = requestAnimationFrame(measureGallery);
  }

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateGallery();
      ticking = false;
    });
  }, { passive: true });

  // Browser zoom, orientation changes, font loading, and responsive layout can all
  // change the track width. Re-measure after each one instead of using stale values.
  window.addEventListener('resize', scheduleMeasure, { passive: true });
  window.addEventListener('load', scheduleMeasure, { once: true });
  window.visualViewport?.addEventListener('resize', scheduleMeasure, { passive: true });
  mobileQuery.addEventListener?.('change', scheduleMeasure);
  if (document.fonts?.ready) document.fonts.ready.then(scheduleMeasure);

  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(track);
    resizeObserver.observe(space);
  }

  scheduleMeasure();
})();


// Smooth anchor navigation; normal wheel/touch scrolling remains natural and accessible.
(() => {
  const style = document.createElement('style');
  style.textContent = `
    html { scroll-behavior: smooth; }
    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior: auto; }
    }
  `;
  document.head.appendChild(style);
})();

// Editorial motion system inspired by high-end studio portfolios.
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.site-header');
  const progress = document.createElement('div');
  progress.className = 'motion-progress';
  document.body.appendChild(progress);
  const cursor = document.createElement('div');
  cursor.className = 'motion-cursor';
  document.body.appendChild(cursor);

  const updateChrome = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    header?.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  window.addEventListener('scroll', updateChrome, { passive: true });
  window.addEventListener('resize', updateChrome);
  updateChrome();

  if (!reduceMotion && matchMedia('(pointer:fine)').matches) {
    window.addEventListener('pointermove', (event) => {
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
      cursor.classList.add('is-visible');
      const target = event.target.closest('a, button, .project-visual');
      cursor.classList.toggle('is-active', Boolean(target));
    }, { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
  }

  const initGSAP = () => {
    if (reduceMotion || !window.gsap || !window.ScrollTrigger) {
      // Native fallback: gently reveal more of the page as elements enter view.
      const revealTargets = document.querySelectorAll(
        '.hero .eyebrow, .hero h1, .hero-bottom, .hero-index, .section-heading, ' +
        '.heading-aside, .approach-grid, .principles > div, .tool-list > div, ' +
        '.project, .project-meta, .about-copy, .aboutIdCard, #aboutIdCard, ' +
        '.contact h2, .contact-bottom, .contact p, .contact a'
      );
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in-view');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
      revealTargets.forEach(el => observer.observe(el));
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    gsap.config({ nullTargetWarn: false });
    document.documentElement.classList.add('reveal-ready');

    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl.from('.site-header > *', { y: -14, opacity: 0, duration: 1.05, stagger: .12 })
      .from('.hero .eyebrow', { y: 20, opacity: 0, duration: .9 }, '-=.35')
      .from('.hero h1', { y: 48, opacity: 0, scale: .985, duration: 1.45 }, '-=.35')
      .from('.hero-bottom > *', { y: 22, opacity: 0, duration: 1.05, stagger: .16 }, '-=.55')
      .from('.hero-index > *', { y: 12, opacity: 0, duration: .75, stagger: .12 }, '-=.45');

    // Slow, editorial reveals: small movement, longer easing, and gentle stagger.
    gsap.utils.toArray(
      '.section-heading, .heading-aside, .approach-grid, .contact-bottom, ' +
      '.about-copy, .aboutIdCard, #aboutIdCard, .contact p, .contact a'
    ).forEach((el) => {
      gsap.from(el, {
        y: 34, opacity: 0, duration: 1.35, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });
    gsap.utils.toArray('.principles > div, .tool-list > div').forEach((el, i) => {
      gsap.from(el, {
        y: 24, opacity: 0, duration: 1.1, delay: (i % 4) * .11,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 93%', once: true }
      });
    });
    gsap.utils.toArray('.project').forEach((el) => {
      const meta = el.querySelector('.project-meta');
      if (!meta) return;
      gsap.from(meta, {
        y: 18, opacity: 0, duration: 1.05, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true }
      });
    });
    gsap.from('.contact h2', {
      y: 38, opacity: 0, duration: 1.4, ease: 'power2.out',
      scrollTrigger: { trigger: '.contact', start: 'top 78%', once: true }
    });

    // Gentle image depth on pointer devices; no layout shifts and no mobile penalty.
    if (matchMedia('(pointer:fine)').matches) {
      document.querySelectorAll('.project-visual').forEach((visual) => {
        visual.addEventListener('pointermove', (event) => {
          const rect = visual.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - .5;
          const y = (event.clientY - rect.top) / rect.height - .5;
          gsap.to(visual, { rotateY: x * 1.8, rotateX: -y * 1.8, transformPerspective: 900, duration: .5, ease: 'power2.out' });
        });
        visual.addEventListener('pointerleave', () => gsap.to(visual, { rotateY: 0, rotateX: 0, duration: .7, ease: 'power3.out' }));
      });
    }
    ScrollTrigger.refresh();
  };

  if (document.readyState === 'complete') initGSAP();
  else window.addEventListener('load', initGSAP, { once: true });
})();

/* Accessible expandable About identity card */
(() => {
  const card = document.getElementById('aboutIdCard');
  const dialog = document.getElementById('aboutIdDialog');
  const close = document.getElementById('aboutIdClose');
  const done = document.getElementById('aboutIdDone');
  const connect = document.getElementById('aboutIdConnect');

  if (!card || !dialog || !close || !done) return;

  let previousFocus = null;

  function openDialog() {
    previousFocus = document.activeElement;

    dialog.classList.add('is-open');
    dialog.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    close.focus();
  }

  function closeDialog() {
    dialog.classList.remove('is-open');
    dialog.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    if (previousFocus) {
      previousFocus.focus();
    }
  }

  card.addEventListener('click', openDialog);

  close.addEventListener('click', closeDialog);
  done.addEventListener('click', closeDialog);

  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      closeDialog();
    }
  });

  document.addEventListener('keydown', event => {
    if (
      event.key === 'Escape' &&
      dialog.classList.contains('is-open')
    ) {
      closeDialog();
    }
  });

  if (connect) {
    connect.addEventListener('click', () => {
      closeDialog();
    });
  }
})();

(() => {
  const clock = document.getElementById('live-time');
  if (!clock) return;

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  });

  function updateClock() {
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date())
        .map(({ type, value }) => [type, value])
    );

    clock.textContent =
      `${parts.weekday}, ${parts.day} ${parts.month} · ` +
      `${parts.hour}:${parts.minute} IST`;
  }

  updateClock();
  setInterval(updateClock, 1000);
})();


(() => {
  const loader = document.getElementById("siteLoader");
  const number = document.getElementById("loaderNumber");
  const smallNumber = document.getElementById("loaderSmallNumber");
  const progressBar = document.getElementById("loaderProgress");
  const status = document.getElementById("loaderStatus");

  if (!loader || !number || !progressBar) return;

  let pageLoaded = document.readyState === "complete";
  let finishedCounting = false;
  let hidden = false;

  const messages = [
    [0, "GETTING THINGS INTO FOCUS..."],
    [25, "OBSERVING THE LITTLE DETAILS..."],
    [50, "PUTTING THE PIECES TOGETHER..."],
    [75, "ALMOST READY TO SHOW YOU..."],
    [100, "THE STORY IS YOURS TO EXPLORE."]
  ];

  const start = performance.now();
  const duration = 2600;

  function renderProgress(value) {
    const count = Math.round(value);
    const formatted = String(count).padStart(3, "0");

    number.textContent = formatted;
    if (smallNumber) smallNumber.textContent = formatted;

    progressBar.style.width = count + "%";

    let message = messages[0][1];

    for (const [threshold, text] of messages) {
      if (count >= threshold) message = text;
    }

    if (status) status.textContent = message;
  }

  function hideLoader() {
    if (hidden || !pageLoaded || !finishedCounting) return;

    hidden = true;
    renderProgress(100);

    setTimeout(() => {
      loader.classList.add("is-hidden");
    }, 350);
  }

  function animate(now) {
    const elapsed = now - start;
    const fraction = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - fraction, 3);

    renderProgress(eased * 100);

    if (fraction < 1) {
      requestAnimationFrame(animate);
    } else {
      finishedCounting = true;
      hideLoader();
    }
  }

  window.addEventListener("load", () => {
    pageLoaded = true;
    hideLoader();
  }, { once: true });

  requestAnimationFrame(animate);
})();

const clickSound = new Audio("sounds/mac-click.mp3");
clickSound.volume = 0.35;

document.addEventListener("click", (event) => {
  const target = event.target.closest(
    "button, a, .project-card, .project-item"
  );

  if (!target) return;

  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});
});