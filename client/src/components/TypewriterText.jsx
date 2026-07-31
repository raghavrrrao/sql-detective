import { useEffect, useState } from 'react';

export function TypewriterText({ text, delay = 0, speed = 26, className = '' }) {
  const [visibleCharacters, setVisibleCharacters] = useState(0);

  useEffect(() => {
    let intervalId;
    const timeoutId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        setVisibleCharacters((current) => {
          if (current >= text.length) {
            window.clearInterval(intervalId);
            return current;
          }
          return current + 1;
        });
      }, speed);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [delay, speed, text]);

  return <span className={className}>{text.slice(0, visibleCharacters)}<span aria-hidden="true" className="ml-0.5 inline-block h-[0.9em] w-px animate-pulse bg-red-400 align-[-0.08em]" /></span>;
}
