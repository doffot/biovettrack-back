// src/utils/validateDifferentialCount.ts
export const validateDifferentialSum = (diff: Record<string, number>): boolean => {
  const sum = Object.values(diff).reduce((acc, val) => acc + val, 0);
  return sum <= 100;
};