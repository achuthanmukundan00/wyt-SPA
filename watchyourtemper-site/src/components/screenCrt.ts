export function initScreenCRT({ storageKey = 'wyt-crt' }: { storageKey?: string } = {}): () => void {
  const root = document.documentElement;
  const button = document.querySelector<HTMLButtonElement>('[data-crt-toggle]');
  let enabled = true;
  try { enabled = localStorage.getItem(storageKey) !== 'off'; } catch { /* Optional preference. */ }
  root.dataset.crt = enabled ? 'on' : 'off';

  const paintToggle = () => {
    if (!button) return;
    button.setAttribute('aria-pressed', String(enabled));
    button.title = enabled ? 'Turn CRT effect off' : 'Turn CRT effect on';
  };
  const persist = () => {
    try { localStorage.setItem(storageKey, enabled ? 'on' : 'off'); } catch { /* Optional preference. */ }
  };
  const onToggle = () => {
    enabled = !enabled;
    root.dataset.crt = enabled ? 'on' : 'off';
    paintToggle();
    persist();
  };

  paintToggle();
  button?.addEventListener('click', onToggle);
  return () => button?.removeEventListener('click', onToggle);
}
