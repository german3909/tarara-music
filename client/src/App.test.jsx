import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';

const songs = Array.from({ length: 10 }, (_, index) => ({
  id: index + 1,
  title: index === 0 ? 'Neón de Medianoche' : `Canción ${index + 1}`,
  artist: index === 0 ? 'Luna Nova' : `Artista ${index + 1}`,
  album: index < 6 ? 'Ciudad Eléctrica' : 'Órbita',
  duration: 25 + index,
  format: ['mp3', 'wav', 'flac', 'aac'][index % 4],
  url: `/media/${index + 1}.mp3`,
  cover: `/covers/${String(index + 1).padStart(2, '0')}.svg`,
  isFavorite: false
}));

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url) => {
      if (String(url).includes('/api/songs')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ songs, total: songs.length, query: '' })
        };
      }
      return {
        ok: false,
        status: 404,
        json: async () => ({ error: 'No encontrado' })
      };
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PA-01 · La biblioteca se muestra en la interfaz', () => {
  it('renderiza las 10 canciones del catálogo', async () => {
    render(<App />);

    expect(await screen.findByText('Neón de Medianoche')).toBeInTheDocument();
    expect(screen.getByText('Canción 10')).toBeInTheDocument();
    expect(screen.getAllByText(/10 canciones/).length).toBeGreaterThan(0);
    expect(screen.getByRole('searchbox', { name: /buscar canciones/i })).toBeInTheDocument();
  });
});

describe('PA-03 · Reproducción desde la interfaz', () => {
  it('reproduce una canción al pulsar el botón y cambia a pausa', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText('Neón de Medianoche');
    const audio = document.querySelector('audio');
    await user.click(screen.getByRole('button', { name: 'Reproducir Neón de Medianoche' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Pausar Neón de Medianoche' })).toBeInTheDocument()
    );
    expect(audio.play).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Pausar' }));
    expect(audio.pause).toHaveBeenCalled();
  });
});

describe('PA-04 · Volumen desde la interfaz', () => {
  it('actualiza el volumen del reproductor con el control deslizante', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText('Neón de Medianoche');
    const slider = screen.getByRole('slider', { name: 'Volumen' });
    const audio = document.querySelector('audio');

    fireEvent.change(slider, { target: { value: '25' } });

    expect(audio.volume).toBeCloseTo(0.25, 2);
  });
});

describe('PA-07 · Favoritos invitan a iniciar sesión cuando no hay cuenta', () => {
  it('abre el formulario de acceso al intentar guardar un favorito como invitado', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText('Neón de Medianoche');
    const favoriteButtons = screen.getAllByRole('button', {
      name: /Añadir Neón de Medianoche a favoritos/i
    });
    await user.click(favoriteButtons[0]);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Bienvenido de nuevo/i })).toBeInTheDocument();
  });
});
