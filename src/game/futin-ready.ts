// Runs after the ordered TypeScript modules. React stores also read on subscribe,
// so hydration may safely happen before or after this event.
window.dispatchEvent(new Event('futin:ready'));
document.documentElement.dataset.futinControllersReady = 'true';



export {};
