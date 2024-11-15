import { FixedMath, Reserve } from '@blend-capital/blend-sdk';
import { Box, Typography, useTheme } from '@mui/material';
import { axisClasses } from '@mui/x-charts';
import { LineChart } from '@mui/x-charts/LineChart';
import { useState } from 'react';
import { toPercentage } from '../../utils/formatter';
import { estimateInterestRate } from '../../utils/math';
import { CustomButton } from '../common/CustomButton';
import { ReserveComponentProps } from '../common/ReserveComponentProps';

interface InterestGraphProps extends ReserveComponentProps {
  reserve: Reserve;
}

export const InterestGraph: React.FC<InterestGraphProps> = ({ poolId, assetId, reserve }) => {
  const theme = useTheme();

  const [showMore, setShowMore] = useState(false);

  const targetUtil = reserve.config.util / 1e7;
  const maxUtil = reserve.config.max_util / 1e7;
  const currentUtil = reserve.getUtilizationFloat();
  let defaultIRModifierReserve = structuredClone(reserve);
  defaultIRModifierReserve.data.interestRateModifier = FixedMath.toFixed(1, 9);
  let dataPoints: { util: number; apr: number }[] = [];
  let defaultDataPoints: { util: number; apr: number }[] = [];
  let utilizationRates = [];

  for (let i = 0; i <= (showMore ? 100 : maxUtil * 100); i++) {
    utilizationRates.push(i / 100);
  }
  utilizationRates = utilizationRates.concat([currentUtil, targetUtil]);
  utilizationRates.sort((a, b) => a - b);
  dataPoints = [
    ...utilizationRates.map((utilRate) => ({
      util: utilRate,
      apr: FixedMath.toFloat(estimateInterestRate(utilRate, reserve), 7),
    })),
  ];
  defaultDataPoints = [
    ...utilizationRates.map((utilRate) => ({
      util: utilRate,
      apr: FixedMath.toFloat(estimateInterestRate(utilRate, defaultIRModifierReserve), 7),
    })),
  ];
  const maxAPR =
    dataPoints.length > 0 && defaultDataPoints.length > 0
      ? Math.max(
          dataPoints[dataPoints.length - 1].apr,
          defaultDataPoints[defaultDataPoints.length - 1].apr
        )
      : 1;
  return (
    <Box
      sx={{
        display: 'flex',
        position: 'relative',
        flexDirection: 'column',
        width: '100%',
        height: '300px',
        padding: '6px',
        margin: '6px',
        borderRadius: '5px',
        background: theme.palette.background.default,
      }}
    >
      <LineChart
        sx={{
          '& .MuiAreaElement-series-CurrentAPR': {
            fill: "url('#bGradient')",
          },
          '& .MuiAreaElement-series-DefaultAPR': {
            fill: "url('#dGradient')",
          },
          [`& .${axisClasses.right} .${axisClasses.label}`]: {
            transform: 'translateX(10px)',
          },
        }}
        xAxis={[
          {
            data: dataPoints.map((point) => point.util),
            label: 'Utilization rate',
            valueFormatter: (element, context) => {
              if (context.location === 'tooltip') {
                if (element === currentUtil) {
                  return `Utilization ${toPercentage(element, 2)} (Current)`;
                } else if (element === targetUtil) {
                  return `Utilization ${toPercentage(element, 2)} (Target)`;
                } else if (element === maxUtil) {
                  return `Utilization ${toPercentage(element, 2)} (Max)`;
                }
                return `Utilization ${toPercentage(element, 2)}`;
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
            label: 'Borrow APR (%)',
            valueFormatter: (element) => `${element * 100}`,
            tickNumber: 5,
            min: 0,
            max: maxAPR,
          },
        ]}
        leftAxis={null}
        bottomAxis={{}}
        topAxis={null}
        rightAxis={{}}
        series={[
          {
            id: 'CurrentAPR',
            data: dataPoints.map((element) => element.apr),
            label: `Current APR (Rate Modifier ${FixedMath.toFloat(
              reserve.data.interestRateModifier,
              9
            ).toFixed(2)})`,
            valueFormatter: (element) => {
              return toPercentage(element!, 2);
            },
            showMark: (element) => {
              return (
                element.position === currentUtil ||
                element.position === targetUtil ||
                element.position === maxUtil
              );
            },
            color: theme.palette.borrow.main,
            area: true,
          },
          {
            id: 'DefaultAPR',
            data: defaultDataPoints.map((element) => element.apr),
            label: `Base APR (Rate Modifier 1.00)`,
            valueFormatter: (element) => {
              return toPercentage(element!, 2);
            },
            showMark: (element) => {
              return (
                element.position === currentUtil ||
                element.position === targetUtil ||
                element.position === maxUtil
              );
            },
            color: theme.palette.grey[500],
            area: true,
          },
        ]}
        slotProps={{
          legend: {
            position: { horizontal: 'left', vertical: 'top' },
            labelStyle: {
              fontSize: 11,
            },
            itemMarkWidth: 10,
            itemMarkHeight: 10,
            direction: 'column',
          },
        }}
        margin={{
          left: 18,
          right: 60,
          top: 18,
          bottom: 60,
        }}
      >
        <defs>
          <linearGradient id="bGradient" gradientTransform="rotate(90)">
            <stop offset="0%" stopColor="#FF8A0026" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id="dGradient" gradientTransform="rotate(90)">
            <stop offset="0%" stopColor="transparent" />
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
  );
};
