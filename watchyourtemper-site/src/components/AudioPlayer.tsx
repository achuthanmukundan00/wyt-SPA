import { useEffect, useRef, useState } from 'react';
import '../styles/index.css';

const AudioPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const handleUserInteraction = () => {
      if (audioRef.current && !isInitialized) {
        audioRef.current.volume = 0.5;
        audioRef.current.loop = true;
        void audioRef.current.play().then(() => {
          setIsInitialized(true);
        }).catch((err) => {
          console.warn('Autoplay failed even after interaction:', err);
        });
        document.removeEventListener('click', handleUserInteraction);
      }
    };

    // Attach event listener for any user click
    document.addEventListener('click', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
    };
  }, [isInitialized]);

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  return (
    <>
      <audio ref={audioRef} src="/audio/s11_burial_loop_A.mp3" />
      {isInitialized && (
        <button id="mute-btn" onClick={toggleMute}>
          {muted ? '🔇' : '🔊'}
        </button>
      )}
    </>
  );
};

export default AudioPlayer;
