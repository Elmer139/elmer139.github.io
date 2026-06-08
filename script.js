/* ════════════════════════════════════════════════════════════════════
   Shawn Conrad — Portfolio
   Hand-rolled. No framework.
   ════════════════════════════════════════════════════════════════════ */

(() => {
  const root = document.documentElement;
  const STORAGE_KEY = 'sc-theme';

  // Progressive enhancement: flip no-js → js as soon as scripting runs.
  // The CSS uses .no-js to lock animations to their final, legible state.
  root.classList.remove('no-js');
  root.classList.add('js');

  /* ── Theme ─────────────────────────────────────────────────────── */
  const getPreferredTheme = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const applyTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      toggle.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
      );
    }
    // Update the meta theme-color in real time for mobile chrome
    const meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#14110E' : '#F0E9DC');
  };

  applyTheme(getPreferredTheme());

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        localStorage.setItem(STORAGE_KEY, next);
        applyTheme(next);
      });
    }

    // Honor system changes only if user hasn't expressed a preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });

    /* ── Masthead scroll state, progress bar, back-to-top ────────── */
    const masthead = document.querySelector('.masthead');
    const progressBar = document.querySelector('.scroll-progress__bar');
    const backToTop = document.getElementById('backToTop');

    if (backToTop) {
      backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    const onScroll = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      const docH = document.documentElement.scrollHeight;

      if (masthead) masthead.classList.toggle('is-scrolled', y > 48);

      if (progressBar) {
        const max = docH - vh;
        const pct = max > 0 ? Math.min(100, (y / max) * 100) : 0;
        progressBar.style.width = `${pct}%`;
      }

      if (backToTop) backToTop.classList.toggle('is-visible', y > vh * 0.9);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ── Kinetic hero — wrap each word's text in an inner span for
       a clip-and-rise reveal, then trigger after a small beat ──── */
    document.querySelectorAll('[data-kinetic]').forEach((el) => {
      const words = el.querySelectorAll('.word');
      words.forEach((w, i) => {
        if (!w.firstElementChild || w.firstElementChild.tagName !== 'EM') {
          // Wrap raw text in an inner span so we can transform it independently
          const inner = document.createElement('span');
          inner.innerHTML = w.innerHTML;
          w.innerHTML = '';
          w.appendChild(inner);
        }
        // Stagger by index
        const inner = w.firstElementChild;
        inner.style.setProperty('--kin-delay', `${i * 90}ms`);
      });
      // Start the reveal once fonts have settled
      const start = () => requestAnimationFrame(() => el.classList.add('is-in'));
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(start);
      } else {
        start();
      }
      // After the longest word transition + max stagger, release the clip
      // so descenders are safe on resize, reflow, and accidental re-paints.
      const releaseAfter = 1000 + (words.length * 90) + 200;
      setTimeout(() => el.classList.add('kin-done'), releaseAfter);
    });


    /* ── Section rule draw-in (hairlines between sections) ───────── */
    if ('IntersectionObserver' in window) {
      const ruleIO = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('rule-in');
            ruleIO.unobserve(entry.target);
          }
        });
      }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });
      document.querySelectorAll('.case, .about, .contact').forEach((el) => ruleIO.observe(el));

      // Colophon top rule + signature reveal share an observer
      const sigIO = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-sig-visible', '');
            sigIO.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      document.querySelectorAll('.colophon').forEach((el) => sigIO.observe(el));
    }

    /* ── Hide broken case screenshots so the layout stays clean ──── */
    document.querySelectorAll('.case__shot').forEach((img) => {
      img.addEventListener('error', () => { img.style.display = 'none'; }, { once: true });
    });

    /* ── Video modal: full-image trigger → accessible lightbox ────── */
    const modal = document.getElementById('videoModal');
    const modalFrame = document.getElementById('videoModalFrame');
    const modalTitle = document.getElementById('videoModalTitle');
    let lastFocused = null;

    const focusableSelectors = 'button:not([disabled]), [href], iframe, [tabindex]:not([tabindex="-1"])';

    const openModal = (loomId, title, returnTo) => {
      if (!modal || !modalFrame) return;
      if (!loomId || loomId.startsWith('[')) {
        console.warn('Loom ID not set for this case yet.');
        return;
      }
      modalTitle.textContent = title;
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.loom.com/embed/${loomId}?autoplay=1`;
      iframe.title = title;
      iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
      iframe.setAttribute('allowfullscreen', '');
      modalFrame.appendChild(iframe);
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      lastFocused = returnTo || document.activeElement;
      // Defer focus to after the open transition begins so the screen reader
      // announces the dialog properly and the close button is reachable.
      setTimeout(() => {
        const closer = modal.querySelector('.modal__close');
        if (closer) closer.focus();
      }, 60);
    };

    const closeModal = () => {
      if (!modal) return;
      modal.setAttribute('aria-hidden', 'true');
      modalFrame.innerHTML = ''; // removes iframe → stops audio
      document.body.classList.remove('modal-open');
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    };

    if (modal) {
      // Close on backdrop click + explicit close button
      modal.querySelectorAll('[data-modal-close]').forEach((el) => {
        el.addEventListener('click', closeModal);
      });

      // Esc to close + focus trap while open
      document.addEventListener('keydown', (e) => {
        if (modal.getAttribute('aria-hidden') === 'true') return;
        if (e.key === 'Escape') {
          e.preventDefault();
          closeModal();
          return;
        }
        if (e.key === 'Tab') {
          const focusable = [...modal.querySelectorAll(focusableSelectors)]
            .filter((el) => el.offsetParent !== null);
          if (!focusable.length) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      });
    }

    // Wire every case-media trigger to open the modal with that case's Loom
    document.querySelectorAll('.case__media-trigger').forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const media = trigger.closest('.case__media');
        if (!media) return;
        openModal(
          media.getAttribute('data-loom-id'),
          media.getAttribute('data-loom-title') || 'Walkthrough',
          trigger
        );
      });
    });

    /* ── Scroll reveal ───────────────────────────────────────────── */
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reveals = document.querySelectorAll('[data-reveal]');

    if (reduce || !('IntersectionObserver' in window)) {
      reveals.forEach((el) => el.classList.add('is-in'));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-in');
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
      );

      // Stagger reveals within shared parents for a crafted cascade
      const seen = new Map();
      reveals.forEach((el) => {
        const parent = el.parentElement;
        const i = (seen.get(parent) || 0);
        el.style.setProperty('--reveal-delay', `${Math.min(i * 90, 360)}ms`);
        seen.set(parent, i + 1);
        io.observe(el);
      });
    }
  });
})();
