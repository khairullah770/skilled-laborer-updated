const { calculateNewAverage } = require('../utils/ratingUtils');

describe('calculateNewAverage', () => {
  it('calculates first rating correctly', () => {
    const avg = calculateNewAverage(0, 0, 4);
    expect(avg).toBe(4);
  });

  it('calculates subsequent ratings correctly', () => {
    const avg = calculateNewAverage(9, 2, 3);
    expect(avg).toBe(3);
  });

  it('handles decimal averages rounded to two decimals', () => {
    const avg = calculateNewAverage(7, 2, 5);
    expect(avg).toBe(3.67);
  });

  it('handles minimum rating', () => {
    const avg = calculateNewAverage(10, 5, 1);
    expect(avg).toBe(1.83);
  });

  it('handles maximum rating', () => {
    const avg = calculateNewAverage(10, 5, 5);
    expect(avg).toBe(2.50);
  });

  it('throws on invalid rating', () => {
    expect(() => calculateNewAverage(0, 0, 'abc')).toThrow();
  });
});

