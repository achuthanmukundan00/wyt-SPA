import { useEffect } from 'react';
import AudioPlayer from './AudioPlayer';
import Layer from './Layer';
import { initializeCrt } from '../crt/crt.js';

// The site controls, and the CRT screen that shows the whole site through one
// tube (src/crt). Without hardware WebGL2 the page shows itself through the
// flat glass (.crt-glass and .crt-raster in site.css).
const SignalScreen: React.FC = () => {
  useEffect(() => initializeCrt(), []);
  return (
    <Layer>
      <aside className="site-controls" id="site-controls" aria-label="Site preferences">
        <button type="button" data-crt-toggle aria-label="CRT effect" aria-pressed="true" title="CRT effect">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="14" rx="3" /><path d="M8 21h8m-4-3v3M7 8h10M7 11h10M7 14h10" /></svg>
        </button>
        <AudioPlayer />
      </aside>
      <div className="crt-glass" aria-hidden="true" />
    </Layer>
  );
};

export default SignalScreen;
