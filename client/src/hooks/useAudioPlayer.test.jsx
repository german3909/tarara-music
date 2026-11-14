import { describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useAudioPlayer } from './useAudioPlayer.js';

const songs = [
  { id: 1, title: 'Uno', artist: 'A', album: 'X', duration: 10, url: '/media/1.mp3', format: 'mp3' },
  { id: 2, title: 'Dos', artist: 'B', album: 'X', duration: 12, url: '/media/2.wav', format: 'wav' },
  { id: 3, title: 'Tres', artist: 'C', album: 'X', duration: 14, url: '/media/3.flac', format: 'flac' }
];

function setup() {
  const audio = document.createElement('audio');
  const audioRef = { current: audio };
  const hook = renderHook(() => useAudioPlayer(audioRef));
  return { audio, audioRef, ...hook };
}

describe('PA-03 · Reproductor: reproducir, pausar y avanzar', () => {
  it('inicia la reproducción en menos de 2 segundos y permite pausar', async () => {
    const { result, audio } = setup();

    const startedAt = performance.now();
    await act(async () => {
      await result.current.playSong(songs[0], songs);
    });
    const elapsed = performance.now() - startedAt;

    expect(elapsed).toBeLessThan(2000);
    expect(audio.play).toHaveBeenCalled();
    expect(result.current.currentSong.id).toBe(1);
    expect(result.current.isPlaying).toBe(true);
    expect(audio.src).toContain('/media/1.mp3');

    await act(async () => {
      await result.current.togglePlay();
    });
    expect(audio.pause).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(false);
  });

  it('avanza a la siguiente pista y retrocede a la anterior', async () => {
    const { result, audio } = setup();

    await act(async () => {
      await result.current.playSong(songs[0], songs);
    });

    await act(async () => {
      result.current.next();
      await Promise.resolve();
    });
    expect(result.current.currentSong.id).toBe(2);
    expect(audio.src).toContain('/media/2.wav');

    await act(async () => {
      result.current.previous();
      await Promise.resolve();
    });
    expect(result.current.currentSong.id).toBe(1);
  });

  it('reproduce automáticamente la siguiente canción al terminar la actual', async () => {
    const { result, audio } = setup();

    await act(async () => {
      await result.current.playSong(songs[0], songs);
    });

    await act(async () => {
      audio.dispatchEvent(new Event('ended'));
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.currentSong.id).toBe(2));
    expect(audio.play).toHaveBeenCalledTimes(2);
  });
});

describe('PA-04 · Control de volumen', () => {
  it('ajusta el volumen del elemento de audio entre 0 y 1', async () => {
    const { result, audio } = setup();

    act(() => result.current.setVolume(0.35));
    expect(result.current.volume).toBeCloseTo(0.35);
    expect(audio.volume).toBeCloseTo(0.35);
    expect(result.current.muted).toBe(false);

    act(() => result.current.setVolume(0));
    expect(result.current.volume).toBe(0);
    expect(audio.volume).toBe(0);
    expect(audio.muted).toBe(true);
  });

  it('permite silenciar y volver a activar el sonido', async () => {
    const { result, audio } = setup();

    act(() => result.current.toggleMute());
    expect(result.current.muted).toBe(true);
    expect(audio.muted).toBe(true);

    act(() => result.current.toggleMute());
    expect(result.current.muted).toBe(false);
    expect(audio.muted).toBe(false);
  });

  it('limita valores fuera de rango', () => {
    const { result, audio } = setup();

    act(() => result.current.setVolume(7));
    expect(result.current.volume).toBe(1);
    expect(audio.volume).toBe(1);

    act(() => result.current.setVolume(-3));
    expect(result.current.volume).toBe(0);
    expect(audio.volume).toBe(0);
  });
});
