import { BackstopPoolEst, FixedMath, PoolEstimate } from '@blend-capital/blend-sdk';
import { Box, Typography } from '@mui/material';
import { useBackstop, useBackstopPool, usePool, usePoolOracle } from '../../hooks/api';
import { getEmissionTextFromValue, toPercentage } from '../../utils/formatter';
import { FlameIcon } from '../common/FlameIcon';
import { PoolComponentProps } from '../common/PoolComponentProps';
import { TooltipText } from '../common/TooltipText';

export const BackstopAPR: React.FC<PoolComponentProps> = ({ poolId, sx, ...props }) => {
  const { data: pool } = usePool(poolId);
  const { data: poolOracle } = usePoolOracle(pool);
  const { data: backstop } = useBackstop();
  const { data: backstopPoolData } = useBackstopPool(poolId);

  let estBackstopApr: number | undefined = undefined;
  let backstopEmissionsPerDayPerLpToken: number | undefined = undefined;
  if (
    pool !== undefined &&
    poolOracle !== undefined &&
    backstop !== undefined &&
    backstopPoolData !== undefined
  ) {
    const poolEst = PoolEstimate.build(pool.reserves, poolOracle);
    const backstopPoolEst = BackstopPoolEst.build(
      backstop.backstopToken,
      backstopPoolData.poolBalance
    );
    estBackstopApr =
      (FixedMath.toFloat(BigInt(pool.config.backstopRate), 7) *
        poolEst.avgBorrowApr *
        poolEst.totalBorrowed) /
      backstopPoolEst.totalSpotValue;
    backstopEmissionsPerDayPerLpToken = backstopPoolData.emissions
      ? backstopPoolData.emissionPerYearPerBackstopToken()
      : 0;
  }

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
      <TooltipText tooltip="Estimated APR based on pool interest sharing." width="100%">
        Backstop APR
      </TooltipText>
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
        {backstopEmissionsPerDayPerLpToken !== undefined &&
          backstopEmissionsPerDayPerLpToken > 0 && (
            <FlameIcon
              height={22}
              width={22}
              title={getEmissionTextFromValue(backstopEmissionsPerDayPerLpToken, 'BLND-USDC LP')}
            />
          )}
      </Box>
    </Box>
  );
};
