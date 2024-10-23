import { AuctionType, Pool, ScaledAuction } from '@blend-capital/blend-sdk';
import { Box, Typography, useTheme } from '@mui/material';
import { useMemo } from 'react';
import { useBackstop, useHorizonAccount, usePoolOracle, useTokenBalance } from '../../hooks/api';
import { calculateAuctionOracleProfit } from '../../utils/auction';
import { toBalance, toCompactAddress } from '../../utils/formatter';
import { DividerSection } from '../common/DividerSection';
import { PoolComponentProps } from '../common/PoolComponentProps';
import { Row } from '../common/Row';
import { Section, SectionSize } from '../common/Section';
import { StackedTextBox } from '../common/StackedTextBox';
import { BidList } from './BidList';
import { LotList } from './LotList';

export interface FilledAuctionCardProps extends PoolComponentProps {
  pool: Pool;
  auction: ScaledAuction;
  index: number;
}

export const FilledAuctionCard: React.FC<FilledAuctionCardProps> = ({ pool, auction, sx }) => {
  const theme = useTheme();
  const { data: poolOracle } = usePoolOracle(pool);
  const { data: backstop } = useBackstop();
  const { data: horizonAccount } = useHorizonAccount();

  const assetKeys = useMemo(() => {
    if (auction.type === AuctionType.Interest) {
      const assets = new Set(auction.data.lot.keys());
      for (const asset of Array.from(auction.data.bid.keys())) {
        assets.add(asset);
      }
      return Array.from(assets);
    }
    return [];
  }, [auction]);

  const assetBalances = new Map<string, bigint>();
  assetKeys.forEach((asset) =>
    assetBalances.set(
      asset,
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useTokenBalance(asset, pool.reserves.get(asset)?.tokenMetadata.asset, horizonAccount).data ??
        BigInt(0)
    )
  );

  const auctionValue = useMemo(() => {
    if (poolOracle && backstop) {
      try {
        return calculateAuctionOracleProfit(
          auction.data,
          auction.type,
          pool,
          poolOracle,
          backstop.backstopToken
        );
      } catch (e) {
        console.error('Error calculating auction value', e);
      }
    }
    return undefined;
  }, [auction, pool, poolOracle, backstop]);
  return (
    <Section width={SectionSize.FULL} sx={{ flexDirection: 'column', marginBottom: '12px', ...sx }}>
      <Box
        sx={{
          width: '100%',
        }}
      >
        <Row>
          <Typography variant="h3" sx={{ margin: '12px' }}>
            Auction {toCompactAddress(auction.user)}
          </Typography>
          <Box
            sx={{
              margin: '6px',
              padding: '6px',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                padding: '4px',
                color: theme.palette.positive.main,
                background: theme.palette.positive.opaque,
                borderRadius: '5px',
                lineHeight: '100%',
              }}
            >
              *{AuctionType[auction.type]}*
            </Box>
          </Box>
        </Row>
        <Row>
          <StackedTextBox
            name="Started"
            text={` ${auction.data.block} `}
            sx={{ width: '50%' }}
          ></StackedTextBox>

          <StackedTextBox
            name="Block Filled"
            text={`${auction.scaleBlock}`}
            sx={{ width: '50%' }}
          ></StackedTextBox>
        </Row>
        {auctionValue !== undefined && (
          <Row>
            <StackedTextBox
              name="Estimated Oracle Profit"
              text={`${toBalance(auctionValue.lot - auctionValue.bid, 3)}`}
              sx={{ width: '100%' }}
            ></StackedTextBox>
          </Row>
        )}
      </Box>
      <LotList
        pool={pool}
        lot={auction.data.lot}
        type={
          auction.type === AuctionType.Interest || auction.type === AuctionType.BadDebt
            ? 'Underlying'
            : 'Collateral'
        }
      />
      <DividerSection />
      <BidList
        pool={pool}
        bid={auction.data.bid}
        type={auction.type === AuctionType.Interest ? 'Underlying' : 'Liability'}
      />

      <Box
        sx={{
          margin: '6px',
          padding: '6px',
          color: theme.palette.positive.main,
          background: theme.palette.positive.opaque,
          borderRadius: '5px',
        }}
      >
        <Typography variant="body1" align="center">
          Filled
        </Typography>
      </Box>
    </Section>
  );
};
