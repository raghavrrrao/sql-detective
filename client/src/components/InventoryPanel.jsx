import { BriefcaseBusiness, Fingerprint, KeyRound, ScrollText, Usb } from 'lucide-react';
import { Panel } from './Panel';

const icons = { Keys: KeyRound, Documents: ScrollText, 'USB Drive': Usb, Fingerprint };

export function InventoryPanel({ items }) {
  return (
    <Panel icon={BriefcaseBusiness} title="Evidence locker" accent="gold" bodyClassName="grid gap-2.5 p-3 sm:grid-cols-2 lg:grid-cols-1">
      {items.map((item) => {
        const Icon = icons[item.name] ?? Fingerprint;
        return (
          <div key={item.name} className="clip-corner-sm flex items-center gap-3 border border-white/10 bg-white/[0.04] px-3.5 py-3">
            <Icon size={17} className={item.tone} strokeWidth={2} />
            <span className="text-sm font-semibold text-bone">{item.name}</span>
            <span className="ml-auto text-right text-xs text-bone-dim">{item.detail}</span>
          </div>
        );
      })}
    </Panel>
  );
}
