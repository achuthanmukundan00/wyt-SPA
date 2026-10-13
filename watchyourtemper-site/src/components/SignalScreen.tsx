import { useEffect } from 'react';
import AudioPlayer from './AudioPlayer';
import { initScreenCRT } from './screenCrt';

const SignalScreen: React.FC = () => {
  useEffect(() => initScreenCRT(), []);
  return (
    <>
      <svg className="crt-filter-defs" width="0" height="0" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
        <filter id="crt-glass-warp" x="-4%" y="-4%" width="108%" height="108%" colorInterpolationFilters="sRGB" primitiveUnits="userSpaceOnUse">
          {/* Slow beam drift gently bends native page content without smearing it. */}
          <feTurbulence type="fractalNoise" baseFrequency="0.002 0.04" numOctaves="1" seed="12" result="beam-noise" />
          <feColorMatrix in="beam-noise" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 0 1" result="beam-jitter" />
          <feDisplacementMap in="SourceGraphic" in2="beam-jitter" scale="8" xChannelSelector="R" yChannelSelector="G" result="beam" />
          <feComponentTransfer in="beam" result="levels">
            <feFuncR type="discrete" tableValues="0 .018 .045 .085 .14 .21 .29 .38 .48 .59 .71 .82 .91 .98 1 1" />
            <feFuncG type="discrete" tableValues="0 .018 .045 .085 .14 .21 .29 .38 .48 .59 .71 .82 .91 .98 1 1" />
            <feFuncB type="discrete" tableValues="0 .018 .045 .085 .14 .21 .29 .38 .48 .59 .71 .82 .91 .98 1 1" />
          </feComponentTransfer>
          <feTurbulence type="fractalNoise" baseFrequency=".67 .53" numOctaves="1" seed="7" result="phosphor-noise" />
          <feColorMatrix in="phosphor-noise" type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1" result="mono-noise" />
          <feComponentTransfer in="mono-noise" result="phosphor-wear">
            <feFuncR type="discrete" tableValues=".72 .86 .97 1" />
            <feFuncG type="discrete" tableValues=".72 .86 .97 1" />
            <feFuncB type="discrete" tableValues=".72 .86 .97 1" />
          </feComponentTransfer>
          <feBlend in="levels" in2="phosphor-wear" mode="multiply" result="signal" />
          <feFlood floodColor="#ffe8e0" x="0" y="0" width="1" height="4" result="red-phosphor" />
          <feFlood floodColor="#e6ffe8" x="1" y="0" width="1" height="4" result="green-phosphor" />
          <feFlood floodColor="#e5eaff" x="2" y="0" width="1" height="4" result="blue-phosphor" />
          <feFlood floodColor="#5c5c5c" x="0" y="3" width="3" height="1" result="beam-gap" />
          <feMerge x="0" y="0" width="3" height="4" result="phosphor-cell">
            <feMergeNode in="red-phosphor" /><feMergeNode in="green-phosphor" /><feMergeNode in="blue-phosphor" /><feMergeNode in="beam-gap" />
          </feMerge>
          <feTile in="phosphor-cell" x="0" y="0" width="100%" height="100%" result="aperture-grille" />
          <feGaussianBlur in="signal" stdDeviation="0.7 0.25" result="phosphor-halo" />
          <feComposite in="signal" in2="phosphor-halo" operator="arithmetic" k2="1" k3="0.22" result="emission" />
          <feBlend in="emission" in2="aperture-grille" mode="multiply" />
        </filter>
      </svg>
      <div className="crt-glue" aria-hidden="true" />
      <div className="crt-grain" aria-hidden="true" />
      <aside className="site-controls" id="site-controls" aria-label="Site preferences">
        <button type="button" data-crt-toggle aria-label="CRT effect" aria-pressed="true" title="CRT effect">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="14" rx="3" /><path d="M8 21h8m-4-3v3M7 8h10M7 11h10M7 14h10" /></svg>
        </button>
        <AudioPlayer />
      </aside>
    </>
  );
};

export default SignalScreen;
