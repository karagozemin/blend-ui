import { HelpOutline } from '@mui/icons-material';
import { Box, Tooltip, Typography } from '@mui/material';
import { useStore } from '../../store/store';
import { getEmissionTextFromValue, toPercentage } from '../../utils/formatter';
import { getEmissionsPerYearPerUnit } from '../../utils/token';
import { FlameIcon } from '../common/FlameIcon';
import { PoolComponentProps } from '../common/PoolComponentProps';

export const BackstopAPY: React.FC<PoolComponentProps> = ({ poolId, sx, ...props }) => {
  const backstopPoolData = useStore((state) => state.backstop?.pools?.get(poolId));
  const poolData = useStore((state) => state.pools.get(poolId));

  const estBackstopApy =
    backstopPoolData && poolData
      ? ((poolData.config.backstopRate / 1e7) *
          poolData.estimates.totalBorrowApy *
          poolData.estimates.totalBorrow) /
        backstopPoolData.estimates.totalSpotValue
      : 0;
  const backstopEmissionsPerDayPerLPToken =
    backstopPoolData && backstopPoolData.emissions
      ? getEmissionsPerYearPerUnit(
          backstopPoolData.emissions.config.eps,
          Number(backstopPoolData.poolBalance.shares - backstopPoolData.poolBalance.q4w) / 1e7,
          7
        )
      : 0;
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '6px',
      }}
    >
      <Tooltip
        title="Estimated APY based on pool interest sharing."
        placement="top"
        enterTouchDelay={0}
        enterDelay={500}
        leaveTouchDelay={3000}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'flex-end',
            ...sx,
          }}
        >
          <Typography variant="body2" color={'text.secondary'}>
            {'Backstop APY'}
          </Typography>
          <HelpOutline sx={{ marginLeft: '6px', width: '15px', color: 'text.secondary' }} />
        </Box>
      </Tooltip>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          ...sx,
        }}
      >
        <Typography variant="h4" color={'text.primary'}>
          {toPercentage(estBackstopApy)}
        </Typography>
        {backstopEmissionsPerDayPerLPToken > 0 && (
          <FlameIcon
            height={22}
            width={22}
            title={getEmissionTextFromValue(backstopEmissionsPerDayPerLPToken, 'BLND-USDC LP')}
          />
        )}
      </Box>
    </Box>
  );
};
