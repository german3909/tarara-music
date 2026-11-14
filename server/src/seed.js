import { SUPPORTED_FORMATS } from './db/schema.js';

export { SUPPORTED_FORMATS };

/**
 * Catálogo local de demostración: 10 pistas que cubren los 4 formatos
 * soportados por el reproductor (MP3, WAV, FLAC y AAC).
 */
export const SONGS = [
  {
    title: 'Neón de Medianoche',
    artist: 'Luna Nova',
    album: 'Ciudad Eléctrica',
    duration: 26,
    format: 'mp3',
    url: '/media/01-neon-de-medianoche.mp3',
    cover: '/covers/01.svg'
  },
  {
    title: 'Amanecer en Marte',
    artist: 'Los Cometas',
    album: 'Órbita',
    duration: 28,
    format: 'wav',
    url: '/media/02-amanecer-en-marte.wav',
    cover: '/covers/02.svg'
  },
  {
    title: 'Café de las Siete',
    artist: 'Martina Solar',
    album: 'Mañanas',
    duration: 25,
    format: 'flac',
    url: '/media/03-cafe-de-las-siete.flac',
    cover: '/covers/03.svg'
  },
  {
    title: 'Río de Cristal',
    artist: 'Eco Andino',
    album: 'Altura',
    duration: 30,
    format: 'aac',
    url: '/media/04-rio-de-cristal.m4a',
    cover: '/covers/04.svg'
  },
  {
    title: 'Fuego Lento',
    artist: 'La Brasa',
    album: 'Cenizas',
    duration: 27,
    format: 'mp3',
    url: '/media/05-fuego-lento.mp3',
    cover: '/covers/05.svg'
  },
  {
    title: 'Satélite',
    artist: 'Luna Nova',
    album: 'Ciudad Eléctrica',
    duration: 24,
    format: 'wav',
    url: '/media/06-satelite.wav',
    cover: '/covers/06.svg'
  },
  {
    title: 'Brisa Digital',
    artist: 'Synth Coral',
    album: 'Píxeles',
    duration: 29,
    format: 'flac',
    url: '/media/07-brisa-digital.flac',
    cover: '/covers/07.svg'
  },
  {
    title: 'Pasos de Lluvia',
    artist: 'Martina Solar',
    album: 'Mañanas',
    duration: 26,
    format: 'aac',
    url: '/media/08-pasos-de-lluvia.m4a',
    cover: '/covers/08.svg'
  },
  {
    title: 'Volcán Azul',
    artist: 'Eco Andino',
    album: 'Altura',
    duration: 28,
    format: 'mp3',
    url: '/media/09-volcan-azul.mp3',
    cover: '/covers/09.svg'
  },
  {
    title: 'Última Función',
    artist: 'Los Cometas',
    album: 'Órbita',
    duration: 31,
    format: 'wav',
    url: '/media/10-ultima-funcion.wav',
    cover: '/covers/10.svg'
  }
];

export async function seedSongs(db) {
  const result = await db.query('SELECT COUNT(*) AS total FROM songs');
  const total = Number(result.rows[0]?.total ?? 0);
  if (total > 0) return { inserted: 0, total };

  for (const song of SONGS) {
    await db.query(
      `INSERT INTO songs (title, artist, album, duration, audio_format, url, cover)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        song.title,
        song.artist,
        song.album,
        song.duration,
        song.format,
        song.url,
        song.cover
      ]
    );
  }

  return { inserted: SONGS.length, total: SONGS.length };
}
