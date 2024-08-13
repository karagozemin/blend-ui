import HelpOutline from '@mui/icons-material/HelpOutline';
import { Box, Skeleton, Tooltip, Typography } from '@mui/material';
import { ViewType, useSettings } from '../../contexts';
import { useStore } from '../../store/store';
import { PoolComponentProps } from '../common/PoolComponentProps';
import { LendMarketCard } from './LendMarketCard';

export const LendMarketList: React.FC<PoolComponentProps> = ({ poolId }) => {
  const { viewType } = useSettings();

  const poolData = useStore((state) => state.pools.get(poolId));

  if (!poolData) {
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
        padding: '6px',
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
          Wallet Balance
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ width: headerWidth }}
        >
          APR
        </Typography>

        {viewType !== ViewType.MOBILE && (
          <Tooltip
            title="The percent of this asset's value added to your borrow capacity."
            placement="top"
            enterTouchDelay={0}
            enterDelay={500}
            leaveTouchDelay={3000}
          >
            <Box sx={{ display: 'flex', flexDirection: 'row' }}>
              <Typography variant="body2" color="text.secondary" align="center">
                Collateral Factor
              </Typography>
              <HelpOutline
                sx={{
                  color: 'text.secondary',
                  width: '15px',
                  marginTop: '-4px',
                  marginLeft: '4px',
                }}
              />
            </Box>
          </Tooltip>
        )}
        <Box sx={{ width: viewType === ViewType.MOBILE ? 'auto' : headerWidth }} />
      </Box>
      {Array.from(poolData.reserves.values()).map((reserve) => (
        <LendMarketCard key={reserve.assetId} poolId={poolId} reserve={reserve} />
      ))}
    </Box>
  );
};
