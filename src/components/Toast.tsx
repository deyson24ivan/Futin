import { useLayoutEffect, useState } from 'react';

export function Toast() {
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  useLayoutEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const previous = window.FutinToast;
    window.FutinToast = (text, error = false) => {
      clearTimeout(timer);
      setMessage({ text, error });
      timer = setTimeout(() => setMessage(null), 4000);
    };
    return () => { clearTimeout(timer); window.FutinToast = previous; };
  }, []);
  return <div className={`club-toast${message?.error ? ' is-error' : ''}`} role="status" aria-live="polite" hidden={!message}>{message?.text}</div>;
}
