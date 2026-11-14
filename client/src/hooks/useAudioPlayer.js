import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Controla el elemento <audio> del reproductor: reproducción, pausa,
 * navegación entre pistas, progreso, volumen y silencio.
 */
export function useAudioPlayer(audioRef) {
  const [queue, setQueue] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const queueRef = useRef(queue);
  const currentSongRef = useRef(currentSong);
  const isPlayingRef = useRef(isPlaying);
  const volumeRef = useRef(volume);
  const mutedRef = useRef(muted);
  const durationRef = useRef(duration);
  const playSongRef = useRef(null);
  const nextRef = useRef(null);

  queueRef.current = queue;
  currentSongRef.current = currentSong;
  isPlayingRef.current = isPlaying;
  volumeRef.current = volume;
  mutedRef.current = muted;
  durationRef.current = duration;

  const playSong = useCallback(
    async (song, list) => {
      const audio = audioRef.current;
      if (!audio || !song) return;

      const nextQueue =
        Array.isArray(list) && list.length > 0
          ? list
          : queueRef.current.length > 0
            ? queueRef.current
            : [song];

      setQueue(nextQueue);
      queueRef.current = nextQueue;

      const changed = currentSongRef.current?.id !== song.id;
      setCurrentSong(song);
      currentSongRef.current = song;

      if (changed) {
        setCurrentTime(0);
        setDuration(Number(song.duration) || 0);
        audio.src = song.url;
        if (typeof audio.load === 'function') {
          audio.load();
        } else {
          audio.currentTime = 0;
        }
      }

      try {
        const result = audio.play?.();
        if (result && typeof result.then === 'function') await result;
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    },
    [audioRef]
  );
  playSongRef.current = playSong;

  const pause = useCallback(() => {
    const audio = audioRef.current;
    audio?.pause?.();
    setIsPlaying(false);
  }, [audioRef]);

  const resume = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !currentSongRef.current) return;
    try {
      await audio.play?.();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }, [audioRef]);

  const togglePlay = useCallback(async () => {
    if (!currentSongRef.current) {
      const first = queueRef.current[0];
      if (first) await playSongRef.current(first, queueRef.current);
      return;
    }

    if (isPlayingRef.current) pause();
    else await resume();
  }, [pause, resume]);

  const next = useCallback(() => {
    const tracks = queueRef.current;
    if (tracks.length === 0) return;
    const index = tracks.findIndex((track) => track.id === currentSongRef.current?.id);
    const nextSong = tracks[(index + 1) % tracks.length];
    if (nextSong) playSongRef.current(nextSong, tracks);
  }, []);
  nextRef.current = next;

  const previous = useCallback(() => {
    const audio = audioRef.current;
    if (audio && Number(audio.currentTime) > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    const tracks = queueRef.current;
    if (tracks.length === 0) return;
    const index = tracks.findIndex((track) => track.id === currentSongRef.current?.id);
    const previousIndex = (index - 1 + tracks.length) % tracks.length;
    const previousSong = tracks[previousIndex];
    if (previousSong) playSongRef.current(previousSong, tracks);
  }, [audioRef]);

  const seek = useCallback(
    (time) => {
      const audio = audioRef.current;
      const max = durationRef.current || 0;
      const value = Math.max(0, Math.min(Number(time) || 0, max));
      if (audio) audio.currentTime = value;
      setCurrentTime(value);
    },
    [audioRef]
  );

  const setVolume = useCallback(
    (value) => {
      const nextVolume = Math.max(0, Math.min(1, Number(value) || 0));
      const audio = audioRef.current;
      setVolumeState(nextVolume);
      const nextMuted = nextVolume === 0;
      setMuted(nextMuted);
      if (audio) {
        audio.volume = nextVolume;
        audio.muted = nextMuted;
      }
    },
    [audioRef]
  );

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    const nextMuted = !mutedRef.current;
    setMuted(nextMuted);
    if (audio) audio.muted = nextMuted;
  }, [audioRef]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const handleTimeUpdate = () => setCurrentTime(Number(audio.currentTime) || 0);
    const handleMetadata = () => setDuration(Number(audio.duration) || 0);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => nextRef.current?.();

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleMetadata);
    audio.addEventListener('durationchange', handleMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.volume = volumeRef.current;
    audio.muted = mutedRef.current;

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleMetadata);
      audio.removeEventListener('durationchange', handleMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioRef]);

  return {
    queue,
    currentSong,
    isPlaying,
    volume,
    muted,
    currentTime,
    duration,
    playSong,
    togglePlay,
    pause,
    resume,
    next,
    previous,
    seek,
    setVolume,
    toggleMute
  };
}
