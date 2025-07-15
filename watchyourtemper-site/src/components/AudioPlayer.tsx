import { useEffect, useRef, useState } from 'react';
import '../styles/index.css';

const AudioPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
      audioRef.current.loop = true;
      void audioRef.current.play().catch(() => {
        // Autoplay might be blocked; wait for user interaction
      });
    }
  }, []);

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  return (
    <>
      <audio ref={audioRef} src="/audio/s11_burial_loop_A.mp3" autoPlay loop />
      <button id="mute-btn" onClick={toggleMute}>
        {muted ? 'MUSIC MUTED' : 'MUTE MUSIC'}
      </button>
    </>
  );
};

export default AudioPlayer;
