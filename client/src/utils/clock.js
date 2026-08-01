/** HH:MM:SS — the format the header, the debrief and the leaderboard share. */
export function formatClock(milliseconds) {
  const total = Math.max(0, Math.floor((milliseconds ?? 0) / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}
