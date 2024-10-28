import { Auctions, getAuctionsfromEvents } from '@blend-capital/blend-sdk';
import { Typography, useTheme } from '@mui/material';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { FilledAuctionCard } from '../components/auction/FilledAuctionCard';
import { OngoingAuctionCard } from '../components/auction/OngoingAuctionCard';
import { Banner } from '../components/common/Banner';
import { Divider } from '../components/common/Divider';
import { Row } from '../components/common/Row';
import { PoolExploreBar } from '../components/pool/PoolExploreBar';
import { TxStatus, useWallet } from '../contexts/wallet';
import {
  useAuctionEventsLongQuery,
  useAuctionEventsShortQuery,
  useBackstop,
  usePool,
  usePoolOracle,
} from '../hooks/api';

const Auction: NextPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const { poolId } = router.query;
  const safePoolId = typeof poolId == 'string' && /^[0-9A-Z]{56}$/.test(poolId) ? poolId : '';
  const { txStatus } = useWallet();
  const { data: pool } = usePool(safePoolId);
  const { data: oracle } = usePoolOracle(pool);
  const { data: backstop } = useBackstop();
  let { data: events, refetch } = useAuctionEventsLongQuery(safePoolId);
  let curser =
    Array.isArray(events) && events[events.length - 1] ? events[events.length - 1].id : '';
  const { data: recentEvents } = useAuctionEventsShortQuery(safePoolId, curser, curser !== '');
  events = events?.concat(recentEvents?.events ?? []);
  const auctions: Auctions =
    oracle && pool && backstop && events && recentEvents
      ? getAuctionsfromEvents(events, backstop.id)
      : { ongoing: [], filled: [] };

  useEffect(() => {
    if (txStatus === TxStatus.SUCCESS) {
      refetch();
    }
  }, [txStatus, refetch]);
  return (
    <>
      <Row>
        <PoolExploreBar poolId={safePoolId} />
      </Row>
      <Divider />

      {pool !== undefined ? (
        <>
          {auctions.ongoing.map((auction, index) => {
            return (
              <OngoingAuctionCard
                key={index}
                index={index}
                auction={auction}
                poolId={safePoolId}
                pool={pool}
                currLedger={recentEvents?.latestLedger ? recentEvents.latestLedger + 1 : 0}
              />
            );
          })}
          {auctions.filled.reverse().map((auction, index) => {
            return (
              <FilledAuctionCard
                key={index}
                index={index}
                auction={auction}
                poolId={safePoolId}
                pool={pool}
              />
            );
          })}
        </>
      ) : (
        <Banner
          sx={{
            color: theme.palette.grey[100],
            backgroundColor: theme.palette.grey[900],
          }}
        >
          <Typography variant="body2">
            {'Unable to load pool state. Please try again later'}
          </Typography>
        </Banner>
      )}
    </>
  );
};

export default Auction;
