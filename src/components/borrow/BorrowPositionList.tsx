import { PositionsEstimate } from '@blend-capital/blend-sdk';
import { Box, Typography } from '@mui/material';
import { ViewType, useSettings } from '../../contexts';
import { usePool, usePoolOracle, usePoolUser } from '../../hooks/api';
import { PoolComponentProps } from '../common/PoolComponentProps';
import { Row } from '../common/Row';
import { Section, SectionSize } from '../common/Section';
import { BorrowBanner } from './BorrowBanner';
import { BorrowPositionCard } from './BorrowPositionCard';

export const BorrowPositionList: React.FC<PoolComponentProps> = ({ poolId }) => {
  const { viewType } = useSettings();

  const { data: pool } = usePool(poolId);
  const { data: poolOracle } = usePoolOracle(pool);
  const { data: poolUserData, isLoading } = usePoolUser(pool);

  if (
    pool === undefined ||
    poolUserData === undefined ||
    poolUserData.positions.liabilities.size === 0
  ) {
    return <></>;
  }

  const poolUserEst =
    poolOracle !== undefined
      ? PositionsEstimate.build(pool, poolOracle, poolUserData.positions)
      : undefined;

  const headerNum = viewType === ViewType.REGULAR ? 5 : 3;
  const headerWidth = `${(100 / headerNum).toFixed(2)}%`;
  return (
    <Row>
      <Section
        type="alt"
        width={SectionSize.FULL}
        sx={{ flexDirection: 'column', paddingTop: '12px', padding: '0px', gap: '4px' }}
      >
        <Row>
          <BorrowBanner totalBorrowed={poolUserEst?.totalBorrowed ?? 0} />
        </Row>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            scrollbarColor: 'black grey',
          }}
        >
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px',
              type: 'alt',
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ width: headerWidth }}>
              Asset
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ width: headerWidth }}
            >
              Balance
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ width: headerWidth }}
            >
              APR
            </Typography>

            <Box
              sx={{ flexGrow: '2', width: viewType === ViewType.MOBILE ? '24px' : headerWidth }}
            />
          </Box>
          <Box sx={{ width: '100%', gap: '.5rem', display: 'flex', flexDirection: 'column' }}>
            {Array.from(pool.reserves.values())
              .filter((reserve) => poolUserData.getLiabilities(reserve) > BigInt(0))
              .map((reserve) => {
                const dTokens = poolUserData.getLiabilityDTokens(reserve);
                return (
                  <BorrowPositionCard
                    key={reserve.assetId}
                    poolId={poolId}
                    reserve={reserve}
                    dTokens={dTokens}
                  />
                );
              })}
          </Box>
        </Box>
      </Section>
    </Row>
  );
};
