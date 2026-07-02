/**
 * CSS-grid placement for the periodic table.
 * Col 1 holds period labels; row 1 holds group labels;
 * one spacer row sits between the main table and the f-block.
 */
export function colFor(x: number): number {
  return x + 1
}

export function rowFor(y: number): number {
  // labels shift everything down one; the dataset skips y=8, so the
  // spacer between the main table and the f-block lands on row 9
  return y + 1
}

export const SPACER_ROW = 9
