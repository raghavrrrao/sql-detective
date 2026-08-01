import { Fingerprint } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative border-t border-white/10 px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm text-bone-dim sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2.5 font-display text-lg font-medium uppercase tracking-[0.16em] text-bone">
          <Fingerprint size={19} className="text-crimson-glow" strokeWidth={2} /> <span className="typo-logo">SQL Detective</span>
        </p>
        <p>Created by <span className="text-bone">Masterminds</span></p>
        <p>© 2026 SQL Detective. All rights reserved.</p>
      </div>
    </footer>
  );
}
