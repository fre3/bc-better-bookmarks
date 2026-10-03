import { describe, expect, it } from 'vitest';
import { peekCoverBottom, type CoveredSheet } from '../src/ui/peek-coverage';
const sheet = (top: number, height = 85, open = false): CoveredSheet => ({ top, bottom: top + height, headerBottom: top + 85, shadowTop: top - 20, open });
describe('copied following-sheet coverage', () => {
  it('bounds adjacent and distant previews independently of an open section height', () => {
    for (const height of [1035, 10000]) {
      const sheets = [sheet(278), sheet(363, height, true), sheet(363 + height)];
      expect(peekCoverBottom(503, 85, sheets)).toBe(588);
      expect(peekCoverBottom(418, 85, sheets)).toBe(503);
    }
  });
  it('still covers partial collapsed headers through their next shadow boundary', () => {
    expect(peekCoverBottom(429, 85, [sheet(278), sheet(363), sheet(448), sheet(533)])).toBe(513);
  });
  it('finishes an overlapped open header, including during entry and exit', () => {
    const sheets = [sheet(363, 1000, true), sheet(1363)];
    expect(peekCoverBottom(320, 85, sheets)).toBe(448);
    expect(peekCoverBottom(280, 85, sheets)).toBe(448);
    expect(peekCoverBottom(270, 85, sheets)).toBe(343);
    expect(peekCoverBottom(400, 85, sheets)).toBe(485);
  });
  it('retains boundary coverage when a short open card is entirely under the preview', () => {
    expect(peekCoverBottom(500, 85, [sheet(363, 150, true), sheet(513), sheet(598)])).toBe(578);
  });
  it('uses actual wrapping heights and leaves a natural lip at the end of the stack', () => {
    const wrapped = { ...sheet(363, 1000, true), headerBottom: 500 };
    expect(peekCoverBottom(350, 110, [wrapped])).toBe(500);
    expect(peekCoverBottom(550, 110, [wrapped])).toBe(660);
    expect(peekCoverBottom(400, 85, [])).toBe(485);
  });
});
