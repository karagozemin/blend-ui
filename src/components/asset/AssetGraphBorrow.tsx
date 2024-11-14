import { FixedMath, Reserve } from '@blend-capital/blend-sdk';
import { Box, Typography, useTheme } from '@mui/material';
import { axisClasses } from '@mui/x-charts';
import { LineChart } from '@mui/x-charts/LineChart';
import { useState } from 'react';
import { useBackstop, usePool, usePoolOracle } from '../../hooks/api';
import { toPercentage } from '../../utils/formatter';
import { estimateEmissionsApr, estimateInterestRate } from '../../utils/math';
import { AprDisplay } from '../common/AprDisplay';
import { CustomButton } from '../common/CustomButton';
import { ReserveComponentProps } from '../common/ReserveComponentProps';
import { Row } from '../common/Row';
import { TooltipText } from '../common/TooltipText';

interface AssetGraphProps extends ReserveComponentProps {
  reserve: Reserve;
}

export const AssetGraphBorrow: React.FC<AssetGraphProps> = ({ poolId, assetId, reserve }) => {
  const theme = useTheme();
  const { data: pool } = usePool(poolId);
  const { data: poolOracle } = usePoolOracle(pool);
  const { data: backstop } = useBackstop();
  const [showMore, setShowMore] = useState(false);

  const oraclePrice = poolOracle?.getPriceFloat(assetId);
  const emissionsPerAsset = reserve?.emissionsPerYearPerBorrowedAsset();
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
      apr: FixedMath.toFloat(estimateInterestRate(utilRate, reserve), 7),
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
            tooltip="The interest rate earned on a borrowed position. This rate will fluctuate based on the market conditions and is accrued to the supplied position."
            width={'100%'}
            sx={{ justifyContent: 'left' }}
          >
            APR
          </TooltipText>
          <AprDisplay
            assetSymbol={reserve.tokenMetadata.symbol}
            assetApr={reserve.borrowApr}
            emissionSymbol={'BLND'}
            emissionApr={emissionApr}
            isSupply={false}
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
          position: 'relative',
          flexDirection: 'column',
          width: '100%',
          height: '250px',
          padding: '6px',
        }}
      >
        <LineChart
          sx={{
            '& .MuiAreaElement-series-Borrow': {
              fill: "url('#bGradient')",
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
                    return `${toPercentage(element, 2)} (Current)`;
                  } else if (element === targetUtil) {
                    return `${toPercentage(element, 2)} (Target)`;
                  } else if (element === maxUtil) {
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
              tickNumber: 5,
              min: 0,
              max: dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].apr : 1,
            },
          ]}
          leftAxis={null}
          bottomAxis={{}}
          topAxis={null}
          rightAxis={{}}
          series={[
            {
              id: 'Borrow',
              data: dataPoints.map((element) => element.apr),
              label: 'APR',
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
            <linearGradient id="bGradient" gradientTransform="rotate(90)">
              <stop offset="0%" stopColor="#FF8A0026" />
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
