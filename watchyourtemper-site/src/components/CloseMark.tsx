// The close mark on drawers and dialogs: drawn, not a glyph, so the site keeps
// to its two type sizes.
const CloseMark: React.FC = () => (
  <svg className="close-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" /></svg>
);

export default CloseMark;
