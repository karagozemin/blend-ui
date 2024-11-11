import { BackstopToken, FixedMath, Reserve } from '@blend-capital/blend-sdk';

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

/**
 * Estimate the interest rate for a reserve given a utilization ratio
 * @param utilizationRatio utilization ratio as a float
 * @param reserve The reserve to estimate the interest rate for
 */
export function estimateInterestRate(utilizationRatio: number, reserve: Reserve): number {
  let rateModifier = FixedMath.toFloat(reserve.data.interestRateModifier, 9);
  let baseRate = reserve.config.r_base / 1e7;
  let targetUtilization = reserve.config.util / 1e7;
  let interestRate = 0;
  const rateOne = reserve.config.r_one / 1e7;
  const rateTwo = reserve.config.r_two / 1e7;
  const rateThree = reserve.config.r_three / 1e7;
  if (utilizationRatio <= targetUtilization) {
    interestRate = rateModifier * (baseRate + (utilizationRatio / targetUtilization) * rateOne);
  } else if (utilizationRatio > targetUtilization && utilizationRatio <= 0.95) {
    interestRate =
      rateModifier *
      (baseRate +
        rateOne +
        ((utilizationRatio - targetUtilization) / (0.95 - targetUtilization)) * rateTwo);
  } else if (utilizationRatio > 0.95) {
    interestRate =
      rateModifier * (baseRate + rateOne + rateTwo) +
      ((utilizationRatio - 0.95) / 0.05) * rateThree;
  }
  return interestRate;
}
