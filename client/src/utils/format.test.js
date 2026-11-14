import { describe, expect, it } from 'vitest';
import { formatLabel, formatTime, initials, matchesSong, trackCount } from './format.js';

describe('Utilidades del reproductor', () => {
  it('formatea duraciones correctamente', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(5)).toBe('0:05');
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(3599)).toBe('59:59');
    expect(formatTime(Number.NaN)).toBe('0:00');
    expect(formatTime(undefined)).toBe('0:00');
  });

  it('genera iniciales y etiquetas legibles', () => {
    expect(initials('Ana Torres')).toBe('AT');
    expect(initials('')).toBe('TM');
    expect(formatLabel('aac')).toBe('AAC');
    expect(formatLabel('flac')).toBe('FLAC');
    expect(trackCount(1)).toBe('1 canción');
    expect(trackCount(5)).toBe('5 canciones');
  });

  it('coincide con título, artista o álbum sin distinguir mayúsculas', () => {
    const song = { title: 'Neón de Medianoche', artist: 'Luna Nova', album: 'Ciudad Eléctrica' };
    expect(matchesSong(song, 'NEÓN')).toBe(true);
    expect(matchesSong(song, 'luna')).toBe(true);
    expect(matchesSong(song, 'ciudad')).toBe(true);
    expect(matchesSong(song, 'zzz')).toBe(false);
    expect(matchesSong(song, '')).toBe(true);
  });
});
