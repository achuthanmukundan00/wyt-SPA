import { useEffect, useRef, useState } from 'react';

const time = (seconds: number) => Number.isFinite(seconds)
  ? `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}` : '00:00';

const AudioPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [starting, setStarting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [message, setMessage] = useState('');
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = .5;
    const pause = () => audio.pause();
    window.addEventListener('pagehide', pause);
    return () => { window.removeEventListener('pagehide', pause); pause(); };
  }, []);
  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio || failed || starting) return;
    if (!audio.paused) { audio.pause(); return; }
    setStarting(true); setMessage('');
    try { await audio.play(); }
    catch { setMessage('Playback could not start. Select Play to retry.'); }
    finally { setStarting(false); }
  };
  const label = failed ? 'Site soundtrack unavailable' : playing ? 'Pause site soundtrack' : 'Play site soundtrack';
  return (
    <>
      <audio ref={audioRef} src="/audio/pressure_test_web.mp3" preload="none" loop
        onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onLoadedMetadata={event => setDuration(event.currentTarget.duration)}
        onDurationChange={event => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
        onTimeUpdate={event => setCurrent(Math.floor(event.currentTarget.currentTime))}
        onError={() => { setFailed(true); setPlaying(false); setMessage('Soundtrack unavailable. The rest of the site is still available.'); }} />
      <button type="button" onClick={() => void togglePlayback()} aria-label={label} title={label} aria-pressed={playing} disabled={failed || starting}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4Z" />{playing ? <path d="M16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /> : <path d="m17 10 4 4m0-4-4 4" />}</svg>
      </button>
      <details className="audio-position" id="soundtrack-controls">
        <summary>Position</summary>
        <div className="audio-position__panel">
          <p>watchyourtemper / pressure_test_web</p>
          <label><span className="sr-only">Soundtrack position</span><input type="range" min="0" max={duration || 157} step="1" value={current} disabled={failed || !duration}
            aria-valuetext={`${time(current)} of ${time(duration)}`}
            onChange={event => {
              const audio = audioRef.current;
              if (!audio || !duration) return;
              audio.currentTime = Number(event.currentTarget.value); setCurrent(Math.floor(audio.currentTime));
            }} /></label>
          <p>{time(current)} / {time(duration)}</p>
        </div>
      </details>
      <p id="sound-status" role="status" aria-live="polite">{message}</p>
    </>
  );
};

export default AudioPlayer;
