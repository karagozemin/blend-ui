import { Reserve } from '@blend-capital/blend-sdk';

export const STELLAR_DECIMALS = 7;
export const SECONDS_PER_DAY = 31536000;

export function getEmissionsPerYearPerUnit(eps: bigint, totalAmount: number, decimals?: number) {
  if (eps === BigInt(0) || totalAmount === 0) {
    return 0;
  }
  const epsNum = Number(Number(eps) / Math.pow(10, decimals || STELLAR_DECIMALS));
  const toReturn = Number((epsNum * SECONDS_PER_DAY) / totalAmount);
  const decimalCount = toReturn.toString().split('.')[1]?.length || 0;
  if (decimalCount > (decimals || STELLAR_DECIMALS)) {
    return Number(toReturn.toFixed(decimals));
  }
  return toReturn;
}

export function getTokenLinkFromReserve(reserve: Reserve | undefined) {
  if (!reserve) {
    return '';
  }
  return `${process.env.NEXT_PUBLIC_STELLAR_EXPERT_URL}/contract/${reserve.assetId}`;
}
