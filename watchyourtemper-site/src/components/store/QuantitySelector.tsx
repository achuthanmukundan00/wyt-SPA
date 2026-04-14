import React from 'react';

type Props = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
};

const QuantitySelector: React.FC<Props> = ({ value, min = 1, max = 20, onChange }) => {
  const nextValue = Math.min(max, Math.max(min, value));

  return (
    <div className="store-qty" aria-label="Quantity selector">
      <button type="button" onClick={() => onChange(Math.max(min, nextValue - 1))} disabled={nextValue <= min}>
        −
      </button>
      <span>{nextValue}</span>
      <button type="button" onClick={() => onChange(Math.min(max, nextValue + 1))} disabled={nextValue >= max}>
        +
      </button>
    </div>
  );
};

export default QuantitySelector;
