import { useEffect } from 'react';
import AudioPlayer from './AudioPlayer';
import { initScreenCRT } from './screenCrt';

const SignalScreen: React.FC = () => {
  useEffect(() => initScreenCRT(), []);
  return (
    <>
      <svg className="crt-filter-defs" width="0" height="0" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
        <filter id="crt-glass-warp" x="-4%" y="-4%" width="108%" height="108%" colorInterpolationFilters="sRGB" primitiveUnits="userSpaceOnUse">
          {/* This compositor pass transforms the rendered page itself, not a glass overlay. */}
          <feTurbulence type="fractalNoise" baseFrequency="0.002 0.04" numOctaves="1" seed="12" result="beam-noise" />
          <feColorMatrix in="beam-noise" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 0 1" result="beam-jitter" />
          <feDisplacementMap in="SourceGraphic" in2="beam-jitter" scale="6" xChannelSelector="R" yChannelSelector="G" result="beam" />
          <feGaussianBlur in="beam" stdDeviation="0.28 0.18" result="soft-beam" />
          <feComponentTransfer in="soft-beam" result="levels">
            <feFuncR type="discrete" tableValues="0 .018 .045 .085 .14 .21 .29 .38 .48 .59 .71 .82 .91 .98 1 1" />
            <feFuncG type="discrete" tableValues="0 .018 .045 .085 .14 .21 .29 .38 .48 .59 .71 .82 .91 .98 1 1" />
            <feFuncB type="discrete" tableValues="0 .018 .045 .085 .14 .21 .29 .38 .48 .59 .71 .82 .91 .98 1 1" />
          </feComponentTransfer>
          <feColorMatrix in="levels" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red-signal" />
          <feColorMatrix in="levels" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green-signal" />
          <feColorMatrix in="levels" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue-signal" />
          <feOffset in="red-signal" dx="-2" dy="0" result="red-fringe" />
          <feOffset in="blue-signal" dx="2" dy="0" result="blue-fringe" />
          <feBlend in="red-fringe" in2="green-signal" mode="screen" result="red-green-signal" />
          <feBlend in="red-green-signal" in2="blue-fringe" mode="screen" result="chromatic-signal" />
          <feTurbulence type="fractalNoise" baseFrequency=".67 .53" numOctaves="1" seed="7" result="phosphor-noise" />
          <feColorMatrix in="phosphor-noise" type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1" result="mono-noise" />
          <feComponentTransfer in="mono-noise" result="phosphor-wear">
            <feFuncR type="discrete" tableValues=".90 .95 .985 1" />
            <feFuncG type="discrete" tableValues=".90 .95 .985 1" />
            <feFuncB type="discrete" tableValues=".90 .95 .985 1" />
          </feComponentTransfer>
          <feGaussianBlur in="chromatic-signal" stdDeviation="0.65 0.35" result="phosphor-halo" />
          <feComposite in="chromatic-signal" in2="phosphor-halo" operator="arithmetic" k2="1" k3="0.1" result="emission" />
          <feBlend in="emission" in2="phosphor-wear" mode="multiply" result="signal" />
          <feFlood floodColor="#ffe2dc" x="0" y="0" width="4" height="10" result="red-phosphor" />
          <feFlood floodColor="#e1ffe5" x="4" y="0" width="4" height="10" result="green-phosphor" />
          <feFlood floodColor="#e0e3ff" x="8" y="0" width="4" height="10" result="blue-phosphor" />
          <feFlood floodColor="#555555" x="0" y="12" width="12" height="4" result="beam-gap" />
          <feMerge x="0" y="0" width="12" height="16" result="phosphor-cell">
            <feMergeNode in="red-phosphor" /><feMergeNode in="green-phosphor" /><feMergeNode in="blue-phosphor" /><feMergeNode in="beam-gap" />
          </feMerge>
          <feTile in="phosphor-cell" x="0" y="0" width="100%" height="100%" result="aperture-grille" />
          <feBlend in="signal" in2="aperture-grille" mode="multiply" />
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
