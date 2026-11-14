export function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

export function parseId(value) {
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function cleanText(value, { min = 1, max = 200 } = {}) {
  const text = String(value ?? '').trim();
  if (text.length < min || text.length > max) return null;
  return text;
}

export function publicUser(row) {
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    createdAt: row.created_at
  };
}

export function serializeSong(row) {
  return {
    id: Number(row.id),
    title: row.title,
    artist: row.artist,
    album: row.album,
    duration: Number(row.duration),
    format: row.audio_format,
    url: row.url,
    cover: row.cover,
    isFavorite: Boolean(row.is_favorite),
    position: row.position === undefined ? undefined : Number(row.position)
  };
}

export function serializePlaylist(row) {
  return {
    id: Number(row.id),
    name: row.name,
    songCount: Number(row.song_count ?? 0),
    createdAt: row.created_at
  };
}
