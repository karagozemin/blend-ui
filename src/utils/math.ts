import { BackstopToken } from '@blend-capital/blend-sdk';

/**
 * Estimate the emissions apr for a reserve
 * @param emissionsPerAsset emissions per asset
 * @param backstopToken backstop token
 * @param assetPrice asset price
 */
export function estimateEmissionsApr(
  emissionsPerAsset: number,
  backstopToken: BackstopToken,
  assetPrice: number
): number {
  return (
    (emissionsPerAsset * (backstopToken.lpTokenPrice / backstopToken.blndPerLpToken) * 0.8) /
    assetPrice
  );
}
