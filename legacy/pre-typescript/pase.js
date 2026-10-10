(() => {
  const list = document.querySelector('[data-pass-level-list]');
  const scroller = document.querySelector('[data-pass-scroll-area]');
  if (!list || !scroller) return;

  const totalLevels = window.FutinSeasonPass?.maxLevel || 50;
  const icon = window.FutinIcons.icon;
  // These are collection illustrations, not assigned rewards. Contents remain
  // explicitly pending in the two lanes and in the level details.
  function rewardArt(level, premium) {
    const choice = level % 3;
    if (level % 10 === 0 && premium) return '<img class="pass-prize-art" src="assets/premium/legacy-trophy.png?v=11" alt="" loading="lazy" decoding="async" />';
    if (choice === 1) return `<img class="pass-prize-art pass-prize-pack" src="${premium ? 'SobreOro.png' : 'SobrePlata.png'}" alt="" loading="lazy" decoding="async" />`;
    if (choice === 2) return '<img class="pass-prize-art pass-prize-coin" src="futin-coin.svg?v=10" alt="" loading="lazy" decoding="async" />';
    const stats = Object.fromEntries(window.FutinCard.labels.map(label => [label, '']));
    return `<span class="pass-prize-card" aria-hidden="true">${window.FutinCard.render({name:'FUTIN',rating:'',position:'',cardStats:stats}, {type:premium ? 'elite' : 'silver',special:false})}</span>`;
  }
  const fragment = document.createDocumentFragment();
  for (let level = 1; level <= totalLevels; level += 1) {
    const item = document.createElement('article');
    item.className = 'pass-step is-upcoming';
    item.dataset.passNode = String(level);
    item.innerHTML = `
      <button type="button" class="pass-step-head" data-inspect-level="${level}" aria-label="Ver nivel ${level}"><span data-pass-node-state>NIVEL</span><strong>${String(level).padStart(2, '0')}</strong>${level % 10 === 0 ? '<i class="pass-milestone" aria-label="Hito de temporada"></i>' : ''}</button>
      <div class="pass-reward-slot is-premium"><span class="pass-prize-stage">${rewardArt(level,true)}</span><strong>PREMIUM</strong><small>POR ANUNCIAR</small></div>
      <div class="pass-reward-slot is-free"><span class="pass-prize-stage">${rewardArt(level,false)}</span><strong>GRATIS</strong><small>POR ANUNCIAR</small></div>`;
    fragment.append(item);
  }
  list.replaceChildren(fragment);
  const jump = document.querySelector('[data-pass-jump]');
  jump.innerHTML = Array.from({length:totalLevels},(_,index) => `<option value="${index + 1}">Nivel ${String(index + 1).padStart(2,'0')}</option>`).join('');
  function goTo(level) {
    const node = list.querySelector(`[data-pass-node="${level}"]`);
    if (!node) return;
    const left = node.getBoundingClientRect().left - scroller.getBoundingClientRect().left + scroller.scrollLeft;
    scroller.scrollTo({left:Math.max(0,left - scroller.clientWidth * .34),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  }
  jump.addEventListener('change',() => goTo(jump.value));
  document.querySelector('[data-pass-current]').addEventListener('click',revealCurrentLevel);
  const detail = document.querySelector('[data-level-dialog]');
  list.addEventListener('click',event => {
    const button = event.target.closest('[data-inspect-level]');
    if (!button) return;
    const level = Number(button.dataset.inspectLevel);
    let xp = 0; for (let i = 1;i < level;i++) xp += window.FutinSeasonPass.xpForLevel(i);
    const state = window.FutinSeasonPass.getState();
    detail.querySelector('[data-level-title]').textContent = `NIVEL ${String(level).padStart(2,'0')}`;
    detail.querySelector('[data-level-description]').textContent = level <= state.level ? `Nivel alcanzado. Requiere ${xp.toLocaleString('es-CO')} XP acumulados.` : `Necesitas ${(xp - state.totalXp).toLocaleString('es-CO')} XP más para alcanzar este nivel.`;
    detail.showModal();
  });
  detail.querySelector('[data-level-close]').addEventListener('click',() => detail.close());
  function updateActivity() {
    const state = window.FutinSeasonPass.getState();
    const percent = state.completed ? 100 : Math.floor(state.totalXp / state.xpCap * 1000) / 10;
    document.querySelector('[data-pass-percent]').textContent = percent;
    document.querySelector('[data-total-xp-meter]').style.width = `${percent}%`;
    jump.value = String(state.level);
    const earned = window.FutinSeasonPass.getDailyEarned();
    document.querySelectorAll('[data-xp-category]').forEach(card => {
      const category = card.dataset.xpCategory;
      const cap = window.FutinSeasonPass.dailyCaps[category];
      const value = Math.min(cap,Number(earned[category]) || 0);
      card.querySelector('[data-category-earned]').textContent = value;
      card.querySelector('.daily-xp-track b').style.width = `${value / cap * 100}%`;
      card.classList.toggle('is-complete',value === cap);
    });
  }
  window.addEventListener('futin:seasonpasschange',updateActivity);
  window.addEventListener('futin:daychange',updateActivity);
  window.addEventListener('storage',updateActivity);
  updateActivity();

  const range = document.querySelector('[data-pass-range]');
  const previousButton = document.querySelector('[data-pass-scroll="-1"]');
  const nextButton = document.querySelector('[data-pass-scroll="1"]');
  const gapSize = () => Number.parseFloat(getComputedStyle(list).columnGap) || 0;

  function updateRange() {
    if (!range) return;
    const step = list.querySelector('.pass-step');
    if (!step) return;
    const stepSize = step.getBoundingClientRect().width + gapSize();
    const first = Math.min(totalLevels, Math.floor(scroller.scrollLeft / stepSize) + 1);
    const visible = Math.max(1, Math.floor((scroller.clientWidth + gapSize()) / stepSize));
    const last = Math.min(totalLevels, first + visible - 1);
    range.textContent = `NIVELES ${String(first).padStart(2, '0')}–${String(last).padStart(2, '0')} DE ${totalLevels}`;
    if (previousButton) previousButton.disabled = scroller.scrollLeft <= 2;
    if (nextButton) nextButton.disabled = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 2;
  }

  function revealCurrentLevel() {
    const level = window.FutinSeasonPass.getState().level;
    jump.value = String(level);
    goTo(level);
  }

  document.querySelectorAll('[data-pass-scroll]').forEach((button) => {
    if (!button.matches('button')) return;
    button.addEventListener('click', () => {
      const direction = Number(button.dataset.passScroll) || 1;
      scroller.scrollBy({ left: direction * Math.max(scroller.clientWidth * 0.78, 3 * 150), behavior: 'smooth' });
    });
  });

  scroller.addEventListener('scroll', updateRange, { passive: true });
  window.addEventListener('resize', updateRange);
  window.addEventListener('futin:seasonpasschange', revealCurrentLevel);
  window.FutinSeasonPass?.refresh();
  requestAnimationFrame(() => {
    revealCurrentLevel();
    updateRange();
  });
})();
