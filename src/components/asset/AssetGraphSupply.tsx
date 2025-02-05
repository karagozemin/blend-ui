import { FixedMath, Reserve } from '@blend-capital/blend-sdk';
import { Box, Typography, useTheme } from '@mui/material';
import { axisClasses } from '@mui/x-charts';
import { LineChart } from '@mui/x-charts/LineChart';
import { useState } from 'react';
import { useBackstop, usePool, usePoolOracle, useTokenMetadata } from '../../hooks/api';
import { toCompactAddress, toPercentage } from '../../utils/formatter';
import { estimateEmissionsApr, estimateInterestRate } from '../../utils/math';
import { AprDisplay } from '../common/AprDisplay';
import { CustomButton } from '../common/CustomButton';
import { ReserveComponentProps } from '../common/ReserveComponentProps';
import { Row } from '../common/Row';
import { TooltipText } from '../common/TooltipText';

interface AssetGraphProps extends ReserveComponentProps {
  reserve: Reserve;
}

export const AssetGraphSupply: React.FC<AssetGraphProps> = ({ poolId, assetId, reserve }) => {
  const theme = useTheme();
  const { data: pool } = usePool(poolId);
  const { data: poolOracle } = usePoolOracle(pool);
  const { data: backstop } = useBackstop();
  const { data: tokenMetadata } = useTokenMetadata(assetId);
  const tokenSymbol = tokenMetadata?.symbol ?? toCompactAddress(assetId);

  const [showMore, setShowMore] = useState(false);

  const oraclePrice = poolOracle?.getPriceFloat(assetId);
  const emissionsPerAsset = reserve?.emissionsPerYearPerSuppliedAsset();
  const emissionApr =
    backstop && emissionsPerAsset && emissionsPerAsset > 0 && oraclePrice
      ? estimateEmissionsApr(emissionsPerAsset, backstop.backstopToken, oraclePrice)
      : undefined;
  const targetUtil = reserve.config.util / 1e7;
  const maxUtil = reserve.config.max_util / 1e7;
  const currentUtil = reserve.getUtilizationFloat();
  let dataPoints: { util: number; apr: number }[] = [];
  let utilizationRates = [];

  for (let i = 0; i <= (showMore ? 100 : maxUtil * 100); i++) {
    utilizationRates.push(i / 100);
  }
  utilizationRates = utilizationRates.concat([currentUtil, targetUtil]);
  utilizationRates.sort((a, b) => a - b);
  dataPoints = [
    ...utilizationRates.map((utilRate) => ({
      util: utilRate,
      apr: FixedMath.toFloat(
        FixedMath.mulFloor(
          estimateInterestRate(utilRate, reserve),
          FixedMath.toFixed(utilRate, 7),
          FixedMath.SCALAR_7
        ),
        7
      ),
    })),
  ];

  return (
    <Box
      sx={{
        width: '100%',
        margin: '6px',
        borderRadius: '5px',
        display: 'flex',
        flexDirection: 'column',
        background: theme.palette.background.default,
      }}
    >
      <Row sx={{ justifyContent: 'space-between', maxHeight: '76px' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            paddingTop: '12px',
            paddingLeft: '18px',
          }}
        >
          <TooltipText
            tooltip="The interest rate earned on a supplied position. This rate will fluctuate based on the market conditions and is accrued to the supplied position."
            width={'100%'}
            sx={{ justifyContent: 'left' }}
          >
            APR
          </TooltipText>
          <AprDisplay
            assetSymbol={tokenSymbol}
            assetApr={reserve.supplyApr}
            emissionSymbol={'BLND'}
            emissionApr={emissionApr}
            isSupply={true}
            direction={'horizontal'}
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            paddingTop: '12px',
            paddingRight: '18px',
          }}
        >
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Rate Modifier
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.primary }} align="right">
            {FixedMath.toFloat(reserve.data.interestRateModifier, 9).toFixed(2)}
          </Typography>
        </Box>
      </Row>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          width: '100%',
          height: '250px',
          padding: '6px',
        }}
      >
        <LineChart
          sx={{
            '& .MuiAreaElement-series-Supply': {
              fill: "url('#sGradient')",
            },
            [`& .${axisClasses.right} .${axisClasses.label}`]: {
              transform: 'translateX(10px)',
            },
          }}
          xAxis={[
            {
              data: dataPoints.map((element) => element.util),
              label: 'Utilization rate',
              valueFormatter: (element, context) => {
                if (context.location === 'tooltip') {
                  if (element === currentUtil) {
                    return `${toPercentage(element, 2)} (Current)`;
                  } else if (element === targetUtil) {
                    return `${toPercentage(element, 2)} (Target)`;
                  } else if (element === reserve.config.max_util / 1e7) {
                    return `${toPercentage(element, 2)} (Max)`;
                  }
                  return `${toPercentage(element, 2)}`;
                } else {
                  return `${toPercentage(element, 0)}`;
                }
              },
              min: 0,
              max: dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].util : 1,
              tickNumber: 4,
            },
          ]}
          yAxis={[
            {
              label: 'Interest rate (%)',
              valueFormatter: (element) => `${element * 100}`,
              min: 0,
              max: dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].apr : 1,
              tickNumber: 5,
            },
          ]}
          tooltip={{}}
          leftAxis={null}
          bottomAxis={{}}
          topAxis={null}
          rightAxis={{}}
          series={[
            {
              id: 'Supply',
              data: dataPoints.map((element) => element.apr),
              label: 'APR',

              valueFormatter: (element) => {
                return `${toPercentage(element!, 2)}`;
              },
              showMark: (element) => {
                return (
                  element.position === reserve.getUtilizationFloat() ||
                  element.position === targetUtil ||
                  element.position === reserve.config.max_util / 1e7
                );
              },
              color: theme.palette.lend.main,
              area: true,
            },
          ]}
          slotProps={{
            legend: {
              hidden: true,
            },
          }}
          margin={{
            left: 18,
            right: 60,
            top: 6,
            bottom: 60,
          }}
        >
          <defs>
            <linearGradient id="sGradient" gradientTransform="rotate(90)">
              <stop offset="0%" stopColor="#00C4EF26" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </LineChart>
        <CustomButton
          onClick={() => setShowMore(!showMore)}
          sx={{
            position: 'absolute',
            padding: '4px',
            right: '5px',
            bottom: '5px',
            color: theme.palette.text.secondary,
            backgroundColor: theme.palette.background.default,
            '&:hover': {
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
            },
          }}
        >
          <Typography variant="body2" fontSize={11}>
            {showMore ? 'Show less' : 'Show all'}
          </Typography>
        </CustomButton>
      </Box>
    </Box>
  );
};
