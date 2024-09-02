import { Reserve } from '@blend-capital/blend-sdk';

export function getTokenLinkFromReserve(reserve: Reserve | undefined) {
  if (!reserve) {
    return '';
  }
  return `${process.env.NEXT_PUBLIC_STELLAR_EXPERT_URL}/contract/${reserve.assetId}`;
}
