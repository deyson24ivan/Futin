/** Required scene elements fail with a useful message instead of a later null access. */
export function required<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T {
  const node = root.querySelector<T>(selector);
  if (!node) throw new Error(`FUTIN: falta el elemento ${selector}`);
  return node;
}
export function eventElement(event: Event): HTMLElement {
  // SVG icons also receive clicks: delegate through their nearest HTML parent.
  let target = event.target instanceof Element ? event.target : null;
  while (target && !(target instanceof HTMLElement)) target = target.parentElement;
  if (!target) throw new Error('FUTIN: interacción sin elemento HTML');
  return target;
}
export function readStored<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || 'null') as T ?? fallback; }
  catch { return fallback; }
}
export function escapeHtml(value: unknown): string {
  const entities: Record<string, string> = {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'};
  return String(value ?? '').replace(/[&<>"']/g, char => entities[char]);
}
