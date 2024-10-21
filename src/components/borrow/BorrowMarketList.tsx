import { Box, Typography } from '@mui/material';
import { ViewType, useSettings } from '../../contexts';
import { usePool } from '../../hooks/api';
import { PoolComponentProps } from '../common/PoolComponentProps';
import { Skeleton } from '../common/Skeleton';
import { TooltipText } from '../common/TooltipText';
import { BorrowMarketCard } from './BorrowMarketCard';

export const BorrowMarketList: React.FC<PoolComponentProps> = ({ poolId }) => {
  const { viewType } = useSettings();

  const { data: pool } = usePool(poolId);

  if (pool === undefined) {
    return <Skeleton />;
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
          gap: '12px',
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
          Available
        </Typography>
        <TooltipText
          tooltip="The interest rate charged for a borrowed position. This rate will fluctuate based on the market conditions, and is accrued to the borrowed position."
          width={headerWidth}
        >
          APR
        </TooltipText>
        {viewType !== ViewType.MOBILE && (
          // <Tooltip
          //   title="The percent of this asset's value subtracted from your borrow capacity."
          //   placement="top"
          //   enterTouchDelay={0}
          //   enterDelay={500}
          //   leaveTouchDelay={3000}
          // >
          //   <Box sx={{ display: 'flex', flexDirection: 'row', width: headerWidth }}>
          //     <Typography variant="body2" color="text.secondary" align="center">
          //       Liability Factor
          //     </Typography>
          //     <HelpOutline
          //       sx={{
          //         color: 'text.secondary',
          //         width: '15px',
          //         marginTop: '-4px',
          //         marginLeft: '4px',
          //       }}
          //     />
          //   </Box>
          // </Tooltip>

          <TooltipText
            tooltip="The percent of this asset's value subtracted from your borrow capacity."
            width={headerWidth}
          >
            Liability Factor
          </TooltipText>
        )}

        <Box sx={{ width: viewType === ViewType.MOBILE ? 'auto' : headerWidth }} />
      </Box>
      {Array.from(pool.reserves.values())
        .filter((reserve) => reserve.config.l_factor > 0)
        .map((reserve) => (
          <BorrowMarketCard key={reserve.assetId} poolId={poolId} reserve={reserve} />
        ))}
    </Box>
  );
};
