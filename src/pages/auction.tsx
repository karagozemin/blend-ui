import { getAuctionsfromEvents } from '@blend-capital/blend-sdk';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, Typography, useTheme } from '@mui/material';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { FilledAuctionCard } from '../components/auction/FilledAuctionCard';
import { OngoingAuctionCard } from '../components/auction/OngoingAuctionCard';
import { Divider } from '../components/common/Divider';
import { Row } from '../components/common/Row';
import { Skeleton } from '../components/common/Skeleton';
import { PoolExploreBar } from '../components/pool/PoolExploreBar';
import { TxStatus, useWallet } from '../contexts/wallet';
import {
  useAuctionEventsLongQuery,
  useAuctionEventsShortQuery,
  useBackstop,
  usePool,
} from '../hooks/api';

const Auction: NextPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const { poolId } = router.query;
  const safePoolId = typeof poolId == 'string' && /^[0-9A-Z]{56}$/.test(poolId) ? poolId : '';
  const { txStatus } = useWallet();
  const {
    data: pool,
    isFetched: isPoolFetched,
    isError: isPoolLoadingError,
  } = usePool(safePoolId, safePoolId !== '');
  const { data: backstop } = useBackstop();
  let {
    data: events,
    refetch,
    isFetched: isLongEventsFetched,
  } = useAuctionEventsLongQuery(safePoolId, safePoolId !== '');
  let curser = Array.isArray(events) && events.length > 0 ? events[events.length - 1].id : '';
  const moreEventsToFetch = curser !== '';
  const { data: recentEvents, isFetched: isShortEventsFetched } = useAuctionEventsShortQuery(
    safePoolId,
    curser,
    moreEventsToFetch && safePoolId !== ''
  );
  events = events?.concat(recentEvents?.events ?? []);
  const auctions =
    pool && backstop && events && events.length > 0
      ? getAuctionsfromEvents(events, backstop.id)
      : undefined;
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

      {isPoolFetched && isLongEventsFetched && (isShortEventsFetched || !moreEventsToFetch) ? (
        !isPoolLoadingError && pool ? (
          auctions ? (
            <>
              {auctions.ongoing.map((auction, index) => {
                return (
                  <OngoingAuctionCard
                    key={index}
                    index={index}
                    auction={auction}
                    poolId={safePoolId}
                    pool={pool}
                    currLedger={recentEvents?.latestLedger ? recentEvents.latestLedger : 0}
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
            <Row
              sx={{
                color: theme.palette.grey[100],
                backgroundColor: theme.palette.grey[900],
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                margin: '6px',
                padding: '12px',
                paddingRight: '20px',
                borderRadius: '5px',
              }}
            >
              <Typography variant="body2">{'No ongoing auctions for this pool'}</Typography>
            </Row>
          )
        ) : (
          <Row
            sx={{
              background: theme.palette.warning.opaque,
              color: theme.palette.warning.main,
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              margin: '6px',
              padding: '12px',
              paddingRight: '20px',
              borderRadius: '5px',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
              <InfoOutlinedIcon sx={{ marginRight: '6px' }} />
              <Typography variant="body2">Unable to load pool data.</Typography>
            </Box>
          </Row>
        )
      ) : (
        <Skeleton />
      )}
    </>
  );
};

export default Auction;
