export function formatTime(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value < 0) return '0:00';
  const minutes = Math.floor(value / 60);
  const rest = Math.floor(value % 60);
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export function trackCount(count) {
  return `${count} ${count === 1 ? 'canción' : 'canciones'}`;
}

export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'TM';
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function formatLabel(format = '') {
  const labels = { mp3: 'MP3', wav: 'WAV', flac: 'FLAC', aac: 'AAC' };
  return labels[String(format).toLowerCase()] || String(format).toUpperCase();
}

export function matchesSong(song, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  return [song.title, song.artist, song.album]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
}
