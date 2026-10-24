// Types for the CRT engine (crt.js), which is plain JavaScript shared with the
// PRESSURE TEST site.
export type CrtStorageKeys = { preference?: string; verdict?: string; still?: string };
export declare const initializeCrt: (storage?: CrtStorageKeys) => () => void;
