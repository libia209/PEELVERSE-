(() => {
  const prevTabRects = new Map();
  let reducedMotionQuery = null;

  function prefersReducedMotion() {
    if (!reducedMotionQuery && window.matchMedia) {
      reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    }
    return Boolean(reducedMotionQuery && reducedMotionQuery.matches);
  }

  // 1. Hero Vietnamese-safe word mask reveal
  function splitHeroWords(el) {
    if (!el || el.dataset.pvWordsSplit === '1') return;
    const text = (el.textContent || '').trim();
    if (!text) return;
    el.dataset.pvWordsSplit = '1';
    if (prefersReducedMotion()) return;

    const words = text.split(/\s+/);
    el.innerHTML = words
      .map(
        (word, idx) =>
          `<span class="pv-word"><span class="pv-wordInner" style="--i:${idx}">${word}</span></span>`
      )
      .join(' ');
  }

  // 2. Scroll reveal (IntersectionObserver, runs once, 70ms stagger)
  function initScrollReveal(root) {
    if (!root) return;
    const targets = root.querySelectorAll(
      '.editorial-metrics > *, .next-step-card, .editorial-section-head, .explore-grid > *, .editorial-story, .editorial-story-grid > *'
    );
    if (!targets.length) return;

    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -28px 0px' }
    );

    const groupCounters = new WeakMap();
    targets.forEach((el) => {
      const parent = el.parentElement || root;
      const idx = groupCounters.get(parent) || 0;
      groupCounters.set(parent, idx + 1);
      el.classList.add('pv-reveal');
      el.style.setProperty('--reveal-delay', `${Math.min(idx, 6) * 70}ms`);
      observer.observe(el);
    });
  }

  // 3. Liquid Gooey Tabs (.pv-ltabs)
  function positionLiquidTabs(wrap, animateFromPrev) {
    const nav = wrap.querySelector('.pv-ltabs__nav');
    const blob = wrap.querySelector('.pv-ltabs__blob');
    const indicator = wrap.querySelector('.pv-ltabs__indicator');
    const activeBtn = nav ? nav.querySelector('.pv-ltabs__btn.active') : null;
    if (!nav || !blob || !activeBtn) return;

    const id = wrap.dataset.ltabsId || '';
    const targetLeft = activeBtn.offsetLeft;
    const targetWidth = activeBtn.offsetWidth;
    if (targetWidth <= 0) return;

    const applyRect = (left, width, instant) => {
      if (instant) {
        blob.classList.add('no-anim');
        if (indicator) indicator.classList.add('no-anim');
      } else {
        blob.classList.remove('no-anim');
        if (indicator) indicator.classList.remove('no-anim');
      }
      blob.style.transform = `translate3d(${left}px, 0, 0)`;
      blob.style.width = `${width}px`;
      if (indicator) {
        indicator.style.transform = `translate3d(${left + 10}px, 0, 0)`;
        indicator.style.width = `${Math.max(12, width - 20)}px`;
      }
    };

    const prev = id ? prevTabRects.get(id) : null;
    if (animateFromPrev && prev && !prefersReducedMotion() && (prev.left !== targetLeft || prev.width !== targetWidth)) {
      applyRect(prev.left, prev.width, true);
      void blob.offsetWidth;
      requestAnimationFrame(() => {
        applyRect(targetLeft, targetWidth, false);
      });
    } else {
      applyRect(targetLeft, targetWidth, !animateFromPrev);
    }

    if (id) {
      prevTabRects.set(id, { left: targetLeft, width: targetWidth });
    }
  }

  function initLiquidTabs(root) {
    const scope = root || document;
    scope.querySelectorAll('.pv-ltabs').forEach((wrap) => {
      positionLiquidTabs(wrap, true);

      if (wrap.dataset.ltabsBound === '1') return;
      wrap.dataset.ltabsBound = '1';

      const nav = wrap.querySelector('.pv-ltabs__nav');
      if (nav && typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => {
          positionLiquidTabs(wrap, false);
        });
        ro.observe(nav);
      }
    });
  }

  // 4. Sliding Hover Highlight + Avatar Selection Inversion for Lists
  function initSlidingList(listEl, itemSelector) {
    if (!listEl || listEl.dataset.pvSlideBound === '1') return;
    listEl.dataset.pvSlideBound = '1';
    listEl.classList.add('pv-slide-list');

    let hl = listEl.querySelector(':scope > .pv-slide-hl');
    if (!hl) {
      hl = document.createElement('div');
      hl.className = 'pv-slide-hl';
      hl.setAttribute('aria-hidden', 'true');
      listEl.prepend(hl);
    }

    const moveHighlight = (item) => {
      if (!item || !listEl.contains(item)) return;
      const top = item.offsetTop;
      const height = item.offsetHeight;
      hl.style.transform = `translate3d(0, ${top}px, 0)`;
      hl.style.height = `${height}px`;
      hl.classList.add('is-active');
    };

    const hideHighlight = () => {
      hl.classList.remove('is-active');
    };

    listEl.addEventListener('pointerover', (e) => {
      const item = e.target.closest(itemSelector);
      if (item && listEl.contains(item)) moveHighlight(item);
    });

    listEl.addEventListener('focusin', (e) => {
      const item = e.target.closest(itemSelector);
      if (item && listEl.contains(item)) moveHighlight(item);
    });

    listEl.addEventListener('pointerleave', hideHighlight);
    listEl.addEventListener('focusout', (e) => {
      if (!listEl.contains(e.relatedTarget)) hideHighlight();
    });

    listEl.addEventListener('click', (e) => {
      const item = e.target.closest(itemSelector);
      if (!item || !listEl.contains(item)) return;
      listEl.querySelectorAll('.pltabs__avatar[data-selected="true"]').forEach((av) => {
        av.setAttribute('data-selected', 'false');
      });
      const avatar = item.querySelector('.pltabs__avatar');
      if (avatar) avatar.setAttribute('data-selected', 'true');
    });
  }

  // 5. Stagger indices for User Account Dropdown items
  function syncAccountDropdownStagger() {
    const menu = document.getElementById('userAccountMenu');
    if (!menu) return;
    const visibleItems = Array.from(menu.querySelectorAll('.user-menu-item')).filter(
      (el) => !el.classList.contains('hidden')
    );
    visibleItems.forEach((el, idx) => {
      el.style.setProperty('--i', String(idx));
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    syncAccountDropdownStagger();
    const accountBtn = document.getElementById('userAccountBtn');
    if (accountBtn) {
      accountBtn.addEventListener('click', () => {
        requestAnimationFrame(syncAccountDropdownStagger);
      });
    }
  });

  window.PEELVERSE_MOTION = {
    splitHeroWords,
    initScrollReveal,
    initLiquidTabs,
    initSlidingList,
    syncAccountDropdownStagger
  };
})();
