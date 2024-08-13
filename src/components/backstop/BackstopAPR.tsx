import { HelpOutline } from '@mui/icons-material';
import { Box, Tooltip, Typography } from '@mui/material';
import { useStore } from '../../store/store';
import { getEmissionTextFromValue, toPercentage } from '../../utils/formatter';
import { getEmissionsPerYearPerUnit } from '../../utils/token';
import { FlameIcon } from '../common/FlameIcon';
import { PoolComponentProps } from '../common/PoolComponentProps';

export const BackstopAPR: React.FC<PoolComponentProps> = ({ poolId, sx, ...props }) => {
  const backstopPoolData = useStore((state) => state.backstop?.pools?.get(poolId));
  const poolData = useStore((state) => state.pools.get(poolId));

  const estBackstopApr =
    backstopPoolData && poolData
      ? ((poolData.config.backstopRate / 1e7) *
          poolData.estimates.avgBorrowApr *
          poolData.estimates.totalBorrow) /
        backstopPoolData.estimates.totalSpotValue
      : 0;
  const sharesToTokens = backstopPoolData
    ? Number(backstopPoolData.poolBalance.tokens) / Number(backstopPoolData.poolBalance.shares)
    : 1;
  const backstopEmissionsPerDayPerLPToken =
    backstopPoolData && backstopPoolData.emissions
      ? getEmissionsPerYearPerUnit(
          backstopPoolData.emissions.config.eps,
          ((Number(backstopPoolData.poolBalance.shares) -
            Number(backstopPoolData.poolBalance.q4w)) /
            1e7) *
            sharesToTokens,
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
        title="Estimated APR based on pool interest sharing."
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
            {'Backstop APR'}
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
          {toPercentage(estBackstopApr)}
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
