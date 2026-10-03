import { expect, it } from 'vitest';
import { peekFooterSpace } from '../src/ui/peek-footer';
it('reserves only the furthest active/retiring overlay past the stable stack', () => {
  expect(peekFooterSpace(800, [760])).toBe(0);
  expect(peekFooterSpace(800, [940])).toBe(140);
  expect(peekFooterSpace(800, [940, 1010])).toBe(210);
  expect(peekFooterSpace(800, [850])).toBe(50);
  expect(peekFooterSpace(800, [])).toBe(0);
});
it('is independent of footer movement and invariant under document scrolling', () => {
  expect(peekFooterSpace(200, [340])).toBe(peekFooterSpace(800, [940]));
  expect(peekFooterSpace(800, [940, 940])).toBe(140);
});
