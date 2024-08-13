import { Box, Skeleton, Typography } from '@mui/material';
import { ViewType, useSettings } from '../../contexts';
import { useStore } from '../../store/store';
import { PoolComponentProps } from '../common/PoolComponentProps';
import { LendPositionCard } from './LendPositionCard';

export const LendPositionList: React.FC<PoolComponentProps> = ({ poolId }) => {
  const { viewType } = useSettings();

  const poolData = useStore((state) => state.pools.get(poolId));
  const userPoolData = useStore((state) => state.userPoolData.get(poolId));

  if (!poolData || !userPoolData) {
    return <Skeleton variant="rectangular" />;
  }

  const headerNum = viewType === ViewType.REGULAR ? 5 : 3;
  const headerWidth = `${(100 / headerNum).toFixed(2)}%`;
  return (
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

        <Box sx={{ flexGrow: '2', width: viewType === ViewType.MOBILE ? '24px' : headerWidth }} />
      </Box>
      <Box sx={{ width: '100%', gap: '.5rem', display: 'flex', flexDirection: 'column' }}>
        {Array.from(poolData.reserves.values())
          .filter(
            (reserve) =>
              (userPoolData.positions.collateral.get(reserve.config.index) ?? BigInt(0)) !=
                BigInt(0) ||
              (userPoolData.positions.supply.get(reserve.config.index) ?? BigInt(0)) != BigInt(0)
          )
          .map((reserve) => (
            <LendPositionCard
              key={reserve.assetId}
              poolId={poolId}
              reserve={reserve}
              userPoolData={userPoolData}
            />
          ))}
      </Box>
    </Box>
  );
};
