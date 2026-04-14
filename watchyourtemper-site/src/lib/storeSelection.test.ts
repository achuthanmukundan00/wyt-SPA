import { describe, expect, test } from 'vitest';
import { getColorOptions, getSelectedVariant, getSizeOptions } from './storeSelection';
import type { StoreVariant } from '../types/store';

const variants: StoreVariant[] = [
  {
    id: '1',
    name: 'Black / S',
    size: 'S',
    color: 'Black',
    price: 25,
    currency: 'USD',
    availability: true,
  },
  {
    id: '2',
    name: 'Black / M',
    size: 'M',
    color: 'Black',
    price: 25,
    currency: 'USD',
    availability: false,
  },
  {
    id: '3',
    name: 'White / S',
    size: 'S',
    color: 'White',
    price: 25,
    currency: 'USD',
    availability: true,
  },
];

describe('store selection helpers', () => {
  test('returns unique color options', () => {
    expect(getColorOptions(variants)).toEqual(['Black', 'White']);
  });

  test('returns size options scoped by color', () => {
    expect(getSizeOptions(variants, 'Black')).toEqual(['S', 'M']);
    expect(getSizeOptions(variants, 'White')).toEqual(['S']);
  });

  test('returns null for unknown variant pair', () => {
    expect(getSelectedVariant(variants, 'White', 'M')).toBeNull();
  });
});
