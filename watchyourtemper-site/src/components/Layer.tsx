import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

// Fixed layers (controls, drawers, dialogs, the toast) are rendered as children
// of <body>, where the CRT screen looks for them to line their hit areas up
// with what it draws. Without a document (server rendering in tests) they
// render in place.
const Layer: React.FC<{ children: ReactNode }> = ({ children }) => (
  typeof document === 'undefined' ? <>{children}</> : createPortal(children, document.body)
);

export default Layer;
