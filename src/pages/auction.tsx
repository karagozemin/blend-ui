import { getAuctionsfromEvents } from '@blend-capital/blend-sdk';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningIcon from '@mui/icons-material/Warning';
import { Box, Typography, useTheme } from '@mui/material';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { FilledAuctionCard } from '../components/auction/FilledAuctionCard';
import { OngoingAuctionCard } from '../components/auction/OngoingAuctionCard';
import { Divider } from '../components/common/Divider';
import { Row } from '../components/common/Row';
import { Section, SectionSize } from '../components/common/Section';
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
  const { data: pool, isError: isPoolLoadingError } = usePool(safePoolId, safePoolId !== '');
  const { data: backstop } = useBackstop();
  const { data: events, isError: isLongEventsError } = useAuctionEventsLongQuery(
    safePoolId,
    safePoolId !== ''
  );
  let curser = Array.isArray(events) && events.length > 0 ? events[events.length - 1].id : '';
  const moreEventsToFetch = curser !== '';
  const {
    data: recentEvents,
    refetch: refetchShortQuery,
    isError: isShortEventsError,
  } = useAuctionEventsShortQuery(safePoolId, curser, moreEventsToFetch && safePoolId !== '');
  const allEvents =
    events !== undefined && recentEvents !== undefined ? events.concat(recentEvents.events) : [];
  const auctions =
    pool && backstop ? getAuctionsfromEvents(allEvents, backstop.id) : { filled: [], ongoing: [] };

  useEffect(() => {
    if (txStatus === TxStatus.SUCCESS) {
      refetchShortQuery();
    }
  }, [txStatus, refetchShortQuery]);

  const hasData = pool && backstop && events !== undefined;
  const hasAuctions = auctions.filled.length > 0 || auctions.ongoing.length > 0;
  const hasError = isPoolLoadingError || isLongEventsError || isShortEventsError;

  return (
    <>
      <Row>
        <PoolExploreBar poolId={safePoolId} />
      </Row>
      <Divider />
      {hasData ? (
        hasAuctions ? (
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
          <Section
            width={SectionSize.FULL}
            sx={{
              background: theme.palette.info.opaque,
              color: theme.palette.text.primary,
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              padding: '12px',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <InfoOutlinedIcon />
              <Typography variant="body2">No recent auctions found for this pool.</Typography>
            </Box>
          </Section>
        )
      ) : hasError ? (
        <Section
          width={SectionSize.FULL}
          sx={{
            background: theme.palette.warning.opaque,
            color: theme.palette.warning.main,
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            padding: '12px',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <WarningIcon />
            <Typography variant="body2">
              Unable to load auctions for this pool. Please check back later.
            </Typography>
          </Box>
        </Section>
      ) : (
        <Skeleton />
      )}
    </>
  );
};

export default Auction;
