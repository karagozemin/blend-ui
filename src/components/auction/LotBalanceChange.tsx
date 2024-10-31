import { AuctionType, Pool, PoolUser, Positions } from '@blend-capital/blend-sdk';
import { BoxProps } from '@mui/material';
import { useBackstop, useHorizonAccount, usePoolUser, useTokenBalance } from '../../hooks/api';
import { toBalance } from '../../utils/formatter';
import { ValueChange } from '../common/ValueChange';

export interface LotBalanceChangeProps extends BoxProps {
  pool: Pool;
  auctionType: AuctionType;
  assetId: string;
  lotAmount: bigint;
  newPosition?: Positions;
}

export const LotBalanceChange: React.FC<LotBalanceChangeProps> = ({
  pool,
  lotAmount,
  auctionType,
  assetId,
  newPosition,
}) => {
  const { data: horizonAccount } = useHorizonAccount();
  const { data: backstop } = useBackstop();
  const { data: lpTokenBalance } = useTokenBalance(
    backstop?.backstopToken?.id ?? '',
    undefined,
    horizonAccount,
    auctionType === AuctionType.BadDebt
  );
  const { data: poolUser } = usePoolUser(pool);
  const { data: tokenBalance } = useTokenBalance(
    assetId,
    pool.reserves.get(assetId)?.tokenMetadata.asset,
    horizonAccount,
    auctionType === AuctionType.Interest
  );

  const reserve = pool.reserves.get(assetId);
  switch (auctionType) {
    case AuctionType.Interest: {
      if (reserve && tokenBalance)
        return (
          <ValueChange
            key={assetId}
            title={`${assetId} balance change`}
            curValue={`${toBalance(tokenBalance, reserve.tokenMetadata.decimals)} ${
              reserve.tokenMetadata.symbol
            }`}
            newValue={`${toBalance(tokenBalance + lotAmount, reserve.tokenMetadata.decimals)} ${
              reserve.tokenMetadata.symbol
            }`}
          />
        );
    }
    case AuctionType.BadDebt: {
      if (backstop && lpTokenBalance) {
        return (
          <ValueChange
            title="Lp Token Balance"
            curValue={`${toBalance(lpTokenBalance, 7)}`}
            newValue={`${toBalance(lpTokenBalance + lotAmount, 7)}`}
          />
        );
      }
    }
    case AuctionType.Liquidation: {
      if (reserve && poolUser && newPosition) {
        const newPoolUser = new PoolUser(poolUser.userId, newPosition, new Map());
        return (
          <ValueChange
            key={assetId}
            title={`${reserve.tokenMetadata.symbol} collateral`}
            curValue={`${toBalance(poolUser.getCollateralFloat(reserve))} ${
              reserve.tokenMetadata.symbol
            }`}
            newValue={`${toBalance(newPoolUser.getCollateralFloat(reserve))} ${
              reserve.tokenMetadata.symbol
            }`}
          />
        );
      }
    }
    default:
      return <></>;
  }
};
