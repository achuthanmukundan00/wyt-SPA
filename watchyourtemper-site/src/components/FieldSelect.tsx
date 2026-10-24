import type { SelectHTMLAttributes } from 'react';

// A select drawn without the platform's arrow, which the CRT screen cannot see;
// the arrow is a glyph in the page instead.
const FieldSelect: React.FC<SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <span className="select">
    <select {...props} />
    <span className="select__mark" aria-hidden="true">↓</span>
  </span>
);

export default FieldSelect;
