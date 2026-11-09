(() => {
  const root = document.documentElement;
  const menuButton = document.querySelector('.menu-toggle');
  const mobileMenu = document.getElementById('mobile-navigation');
  const brief = document.getElementById('mission-brief');
  const stage = document.getElementById('spacecraft-stage');
  const motionButton = document.getElementById('motion-control');
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const strip = document.querySelector('.strip-track');
  const sectionLinks = [...document.querySelectorAll('.desktop-nav a')];
  const sections = sectionLinks.map(link => document.querySelector(link.hash));
  const sectionAnimations = new Set();
  let paused = motionQuery.matches;
  let updateFrame = 0;

  function closeMenu(returnFocus = false) {
    mobileMenu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    if (returnFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', () => {
    const opening = mobileMenu.hidden;
    menuButton.setAttribute('aria-expanded', String(opening));
    mobileMenu.hidden = !opening;
  });
  mobileMenu.addEventListener('click', () => closeMenu());
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !mobileMenu.hidden) closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (!mobileMenu.hidden && !event.target.closest('.mast')) closeMenu();
  });
  matchMedia('(min-width:761px)').addEventListener('change', event => {
    if (event.matches) closeMenu();
  });

  document.getElementById('open-brief').addEventListener('click', () => brief.showModal());
  brief.querySelector('.brief-close').addEventListener('click', () => brief.close());
  document.getElementById('brief-lineup').addEventListener('click', () => brief.close());
  brief.addEventListener('click', event => {
    if (event.target !== brief) return;
    const r = brief.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) brief.close();
  });

  function updateMotion() {
    root.classList.toggle('motion-paused', paused);
    motionButton.setAttribute('aria-pressed', String(paused));
    const label = paused ? 'Play motion' : 'Pause motion';
    motionButton.setAttribute('aria-label', label);
    motionButton.title = label;
    motionButton.querySelector('use').setAttribute('href', paused ? '#play' : '#pause');
    window.orbitSatellite?.setPaused(paused);
    if (paused) sectionAnimations.forEach(animation => animation.finish());
  }
  motionButton.addEventListener('click', () => { paused = !paused; updateMotion(); requestUpdate(); });
  motionQuery.addEventListener('change', event => { paused = event.matches; updateMotion(); requestUpdate(); });
  stage.addEventListener('orbit:ready', updateMotion);
  document.getElementById('reset-view').addEventListener('click', () => window.orbitSatellite?.reset());

  function updatePage() {
    updateFrame = 0;
    const y = window.scrollY;
    if (!paused) strip.style.setProperty('--strip-offset', -Math.min(y,1600) * .155 + 'px');
    const threshold = Math.min(240, innerHeight * .35);
    let active = 0;
    sections.forEach((section, index) => {
      if (section && section.getBoundingClientRect().top <= threshold) active = index;
    });
    if (innerHeight + y >= root.scrollHeight - 3) active = sections.length - 1;
    sectionLinks.forEach((link, index) => {
      if (index === active) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
  }
  function requestUpdate() {
    if (!updateFrame) updateFrame = requestAnimationFrame(updatePage);
  }
  addEventListener('scroll', requestUpdate, {passive:true});
  addEventListener('resize', requestUpdate, {passive:true});
  if ('IntersectionObserver' in window && Element.prototype.animate) {
    const reveal = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        reveal.unobserve(entry.target);
        if (paused) continue;
        const card = entry.target;
        const delay = innerWidth > 760 ? [...card.parentElement.children].indexOf(card) * 75 : 0;
        const animation = card.animate([
          {transform:'perspective(900px) translateY(28px) rotateX(-4deg)',opacity:.65},
          {transform:'perspective(900px) translateY(0) rotateX(0)',opacity:1}
        ], {duration:540,delay,easing:'cubic-bezier(.18,.75,.25,1)',fill:'backwards'});
        sectionAnimations.add(animation);
        animation.onfinish = () => sectionAnimations.delete(animation);
      }
    }, {threshold:.06});
    document.querySelectorAll('.pf-card').forEach(card => reveal.observe(card));
  }
  updateMotion();
  updatePage();
})();
