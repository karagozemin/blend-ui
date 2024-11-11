import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Box, IconButton, useTheme } from '@mui/material';
import { axisClasses } from '@mui/x-charts';
import { LineChart } from '@mui/x-charts/LineChart';
import { useBackstop, usePool, usePoolOracle } from '../../hooks/api';
import { toPercentage } from '../../utils/formatter';
import { estimateEmissionsApr, estimateInterestRate } from '../../utils/math';
import { AprDisplay } from '../common/AprDisplay';
import { ReserveComponentProps } from '../common/ReserveComponentProps';
import { Row } from '../common/Row';
import { TooltipText } from '../common/TooltipText';

export const AssetGraphBorrow: React.FC<ReserveComponentProps> = ({ poolId, assetId }) => {
  const theme = useTheme();
  const { data: pool } = usePool(poolId);
  const { data: poolOracle } = usePoolOracle(pool);
  const { data: backstop } = useBackstop();
  const reserve = pool?.reserves.get(assetId);
  const oraclePrice = poolOracle?.getPriceFloat(assetId);
  const emissionsPerAsset = reserve?.emissionsPerYearPerBorrowedAsset();
  const emissionApr =
    backstop && emissionsPerAsset && emissionsPerAsset > 0 && oraclePrice
      ? estimateEmissionsApr(emissionsPerAsset, backstop.backstopToken, oraclePrice)
      : undefined;
  let dataPoints: { util: number; apr: number }[] = [];
  if (reserve) {
    let utilizationRates = Array.from({ length: 100 }, (_, i) => i / 100);
    utilizationRates = utilizationRates.concat([
      reserve.getUtilizationFloat(),
      reserve.config.util / 1e7,
    ]);
    utilizationRates.sort((a, b) => a - b);
    dataPoints = [
      ...utilizationRates.map((utilRate) => ({
        util: utilRate,
        apr: estimateInterestRate(utilRate, reserve),
      })),
    ];
  }
  return (
    <>
      {' '}
      {reserve && (
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
            <IconButton
              onClick={() =>
                window.open(
                  `https://docs.blend.capital/whitepaper/blend-whitepaper#interest-rates`,
                  '_blank'
                )
              }
              size="small"
              sx={{
                margin: '18px',
                color: theme.palette.text.secondary,
              }}
            >
              <OpenInNewIcon fontSize="inherit" />
            </IconButton>
          </Row>
          <Box sx={{ width: '100%', height: '250px', padding: '6px' }}>
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
                      if (element === reserve.getUtilizationFloat()) {
                        return `${toPercentage(element, 2)} (Current)`;
                      } else if (element === reserve.config.util / 1e7) {
                        return `${toPercentage(element, 1)} (Target)`;
                      }
                      return `${toPercentage(element, 1)}`;
                    } else {
                      return `${toPercentage(element, 0)}`;
                    }
                  },
                  tickInterval: [0, 0.25, 0.5, 0.75, 1],
                },
              ]}
              yAxis={[
                {
                  label: 'Interest rate (%)',
                  valueFormatter: (element) => `${element * 100}`,
                  tickMinStep: 0.5,
                  tickMaxStep: 0.5,
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
                      element.position === reserve.getUtilizationFloat() ||
                      element.position === reserve.config.util / 1e7
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
          </Box>
        </Box>
      )}
    </>
  );
};
