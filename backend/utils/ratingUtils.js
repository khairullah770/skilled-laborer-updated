const calculateNewAverage = (previousTotal, previousCount, newRating) => {
  const total = Number(previousTotal) || 0;
  const count = Number(previousCount) || 0;
  const value = Number(newRating);
  if (!Number.isFinite(value)) {
    throw new Error('Invalid rating value');
  }
  const nextCount = count + 1;
  const nextTotal = total + value;
  const avg = nextTotal / nextCount;
  return Number(avg.toFixed(2));
};

module.exports = {
  calculateNewAverage,
};

