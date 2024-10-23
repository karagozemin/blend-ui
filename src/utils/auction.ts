import {
  AuctionData,
  AuctionType,
  BackstopToken,
  FixedMath,
  Pool,
  PoolOracle,
} from '@blend-capital/blend-sdk';

export function calculateAuctionOracleProfit(
  auction: AuctionData,
  type: AuctionType,
  pool: Pool,
  oracle: PoolOracle,
  backstopToken: BackstopToken
): { lot: number; bid: number } | undefined {
  let lotValue = 0;
  let bidValue = 0;

  for (const [asset, amount] of Array.from(auction.lot.entries())) {
    switch (type) {
      case AuctionType.BadDebt:
        lotValue += FixedMath.toFloat(amount, 7) * backstopToken.lpTokenPrice;
        break;
      default:
        const reserve = pool.reserves.get(asset);
        const price = oracle.getPriceFloat(asset);
        if (reserve === undefined || price === undefined) {
          return undefined;
        } else {
          lotValue += reserve.toAssetFromBTokenFloat(amount) * price;
        }
    }
  }
  for (const [asset, amount] of Array.from(auction.bid.entries())) {
    switch (type) {
      case AuctionType.Interest:
        bidValue += FixedMath.toFloat(amount, 7) * backstopToken.lpTokenPrice;
        break;
      default:
        const reserve = pool.reserves.get(asset);
        const price = oracle.getPriceFloat(asset);
        if (reserve === undefined || price === undefined) {
          return undefined;
        } else {
          bidValue += reserve.toAssetFromDTokenFloat(amount) * price;
        }
    }
  }

  return {
    lot: lotValue,
    bid: bidValue,
  };
}
