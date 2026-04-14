import type { StoreVariant } from '../types/store';

export const getColorOptions = (variants: StoreVariant[]): string[] =>
  Array.from(new Set(variants.map((variant) => variant.color)));

export const getSizeOptions = (variants: StoreVariant[], color: string): string[] =>
  Array.from(
    new Set(
      variants
        .filter((variant) => variant.color === color)
        .map((variant) => variant.size),
    ),
  );

export const getSelectedVariant = (
  variants: StoreVariant[],
  color: string,
  size: string,
): StoreVariant | null =>
  variants.find((variant) => variant.color === color && variant.size === size) || null;
