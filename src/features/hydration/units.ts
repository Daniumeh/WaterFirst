export type HydrationUnit = 'cl' | 'ml' | 'L';

export function formatHydrationAmount(amountMl: number, unit: HydrationUnit) {
  if (unit === 'ml') {
    return `${Math.round(amountMl)}ml`;
  }

  if (unit === 'L') {
    return `${trimDecimal(amountMl / 1000)}L`;
  }

  return `${Math.round(amountMl / 10)}cl`;
}

export function unitToMl(amount: number, unit: HydrationUnit) {
  if (unit === 'ml') {
    return amount;
  }

  if (unit === 'L') {
    return amount * 1000;
  }

  return amount * 10;
}

function trimDecimal(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
