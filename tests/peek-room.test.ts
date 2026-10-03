import { expect, it } from 'vitest';
import { finalPeekHeight } from '../src/ui/usePeekRoom';
it('uses natural footer room, suppressing less than one readable line without reserving space', () => {
  expect(finalPeekHeight(0, 56, 20)).toBe(0);
  expect(finalPeekHeight(75, 56, 20)).toBe(0);
  expect(finalPeekHeight(76, 56, 20)).toBe(76);
  expect(finalPeekHeight(110, 56, 20)).toBe(110);
  expect(finalPeekHeight(800, 56, 20)).toBe(140);
  expect(finalPeekHeight(100, 83, 20)).toBe(0);
});
