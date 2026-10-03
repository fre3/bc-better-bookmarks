import { expect, it } from 'vitest';
import { peekFooterSpace, retainedPeekSpace } from '../src/ui/peek-footer';
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

it('holds only the space supporting a wheel-selected viewport while peeks retire', () => {
  expect(retainedPeekSpace(0, 140, 423, 600, 943)).toBe(80);
  expect(retainedPeekSpace(35, 80, 423, 600, 943)).toBe(80);
  expect(retainedPeekSpace(140, 80, 423, 600, 943)).toBe(140);
  expect(retainedPeekSpace(0, 140, 423, 600, 943)).toBe(80);
});
it('releases on upward scrolling without accumulating or inventing space', () => {
  expect(retainedPeekSpace(0, 80, 403, 600, 943)).toBe(60);
  expect(retainedPeekSpace(0, 60, 343, 600, 943)).toBe(0);
  expect(retainedPeekSpace(0, 0, 500, 600, 943)).toBe(0);
  expect(retainedPeekSpace(0, 80, 423, 600, 943.4)).toBe(80);
  expect(retainedPeekSpace(0, 80, 423, 600, 1500)).toBe(0);
});
