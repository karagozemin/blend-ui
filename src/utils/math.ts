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
export function estimateInterestRate(utilizationRatio: number, reserve: Reserve): bigint {
  const curUtil = FixedMath.toFixed(utilizationRatio, 7);
  let curIr: bigint;
  const targetUtil = BigInt(reserve.config.util);
  const fixed_95_percent = BigInt(9_500_000);
  const fixed_5_percent = BigInt(500_000);

  // calculate current IR
  if (curUtil <= targetUtil) {
    const utilScalar = FixedMath.divCeil(curUtil, targetUtil, FixedMath.SCALAR_7);
    const baseRate =
      FixedMath.mulCeil(utilScalar, BigInt(reserve.config.r_one), FixedMath.SCALAR_7) +
      BigInt(reserve.config.r_base);
    curIr = FixedMath.mulCeil(baseRate, reserve.data.interestRateModifier, FixedMath.SCALAR_9);
  } else if (curUtil <= fixed_95_percent) {
    const utilScalar = FixedMath.divCeil(
      curUtil - targetUtil,
      fixed_95_percent - targetUtil,
      FixedMath.SCALAR_7
    );
    const baseRate =
      FixedMath.mulCeil(utilScalar, BigInt(reserve.config.r_two), FixedMath.SCALAR_7) +
      BigInt(reserve.config.r_one) +
      BigInt(reserve.config.r_base);
    curIr = FixedMath.mulCeil(baseRate, reserve.data.interestRateModifier, FixedMath.SCALAR_9);
  } else {
    const utilScalar = FixedMath.divCeil(
      curUtil - fixed_95_percent,
      fixed_5_percent,
      FixedMath.SCALAR_7
    );
    const extraRate = FixedMath.mulCeil(
      utilScalar,
      BigInt(reserve.config.r_three),
      FixedMath.SCALAR_7
    );
    const intersection = FixedMath.mulCeil(
      reserve.data.interestRateModifier,
      BigInt(reserve.config.r_two) + BigInt(reserve.config.r_one) + BigInt(reserve.config.r_base),
      FixedMath.SCALAR_9
    );
    curIr = extraRate + intersection;
  }
  return curIr;
}
