export function erc20ValueToAmount(value: bigint, decimals: number): number {
  const raw = value.toString().padStart(decimals + 1, '0');
  const amount = Number(
    Number(`${raw.slice(0, -decimals)}.${raw.slice(-decimals)}`).toFixed(2),
  );
  return amount;
}
