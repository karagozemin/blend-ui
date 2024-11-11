import { BackstopToken, FixedMath } from '@blend-capital/blend-sdk';

/**
 * Estimate the emissions apr for a reserve
 * @param emissionsPerAsset emissions per asset per year as a float
 * @param backstopToken backstop token
 * @param assetPrice asset price
 */
export function estimateEmissionsApr(
  emissionsPerAssetPerYear: number,
  backstopToken: BackstopToken,
  assetPrice: number
): number {
  const usdcPerBlnd =
    FixedMath.toFloat(backstopToken.usdc, 7) /
    0.2 /
    (FixedMath.toFloat(backstopToken.blnd, 7) / 0.8);
  return (emissionsPerAssetPerYear * usdcPerBlnd) / assetPrice;
}
