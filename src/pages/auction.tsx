import { Auctions, getAuctionsfromEvents } from '@blend-capital/blend-sdk';
import { useTheme } from '@mui/material';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { FilledAuctionCard } from '../components/auction/FilledAuctionCard';
import { OngoingAuctionCard } from '../components/auction/OngoingAuctionCard';
import { Divider } from '../components/common/Divider';
import { Row } from '../components/common/Row';
import { Skeleton } from '../components/common/Skeleton';
import { PoolExploreBar } from '../components/pool/PoolExploreBar';
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
  const { data: pool } = usePool(safePoolId);
  const { data: oracle } = usePoolOracle(pool);
  const { data: backstop } = useBackstop();
  let { data: events } = useAuctionEventsLongQuery(safePoolId);
  let curser =
    Array.isArray(events) && events[events.length - 1] ? events[events.length - 1].id : '';
  const { data: recentEvents } = useAuctionEventsShortQuery(safePoolId, curser);

  events = events?.concat(recentEvents?.events ?? []);
  curser = Array.isArray(events) && events[events.length - 1] ? events[events.length - 1].id : '';
  const auctions: Auctions =
    oracle && pool && backstop && events && recentEvents
      ? getAuctionsfromEvents(events, backstop.id)
      : { ongoing: [], filled: [] };

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
        <Skeleton />
      )}
    </>
  );
};

export default Auction;
