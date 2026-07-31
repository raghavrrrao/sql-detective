import { Volume2, VolumeX } from 'lucide-react';
import { useSound } from '../context/SoundContext';

export function SoundToggle() {
  const { isSoundEnabled, toggleSound } = useSound();
  const label = isSoundEnabled ? 'Mute future sound effects' : 'Enable future sound effects';

  return (
    <button
      type="button"
      onClick={toggleSound}
      aria-label={label}
      title={label}
      className="clip-corner-sm inline-flex h-10 w-10 items-center justify-center border border-white/12 bg-white/[0.04] text-bone-muted transition-colors hover:border-gold/50 hover:text-gold-bright"
    >
      {isSoundEnabled ? <Volume2 size={18} strokeWidth={2} /> : <VolumeX size={18} strokeWidth={2} />}
    </button>
  );
}
