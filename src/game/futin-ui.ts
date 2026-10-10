(() => {
  'use strict';
  const tabs = [...document.querySelectorAll<HTMLElement>('[data-minigame-view]')];
  if (!tabs.length) return;
  const panels = {
    penalty: document.getElementById('penalty-game-panel'),
    guess: document.getElementById('guess-game-panel')
  };
  const attempts = document.querySelector<HTMLElement>('.daily-attempts')!;
  function selectGame(name: string | undefined) {
    const selected = name === 'guess' ? 'guess' : 'penalty';
    tabs.forEach(tab => {
      const active = tab.dataset.minigameView === selected;
      tab.classList.toggle('is-selected', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    Object.entries(panels).forEach(([key, panel]) => {
      if (panel) panel.hidden = key !== selected;
    });
    if (attempts) attempts.hidden = selected !== 'penalty';
  }
  function fromHash() {
    selectGame(location.hash.includes('guess') ? 'guess' : 'penalty');
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      const game = tab.dataset.minigameView;
      selectGame(game);
      history.replaceState(null, '', game === 'guess' ? '#guess-game-title' : '#death-game-title');
    });
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].click();
      tabs[next].focus();
    });
  });
  addEventListener('hashchange', fromHash);
  fromHash();
})();



export {};
