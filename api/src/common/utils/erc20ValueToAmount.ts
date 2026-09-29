/**
 *  @description Convert an ERC20 value to an amount based on the decimals
 *
 *  @example
 *  erc20ValueToAmount(1000000000000000000, 6) // 0.001
 */
export function erc20ValueToAmount(value: bigint, decimals: number): number {
  const raw = value.toString().padStart(decimals + 1, '0');
  const amount = Number(
    Number(`${raw.slice(0, -decimals)}.${raw.slice(-decimals)}`).toFixed(2),
  );
  return amount;
}
