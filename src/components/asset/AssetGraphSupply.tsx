import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Box, IconButton, useTheme } from '@mui/material';
import { axisClasses } from '@mui/x-charts';
import { LineChart } from '@mui/x-charts/LineChart';
import { AprDisplay } from '../common/AprDisplay';
import { PoolComponentProps } from '../common/PoolComponentProps';
import { Row } from '../common/Row';
import { TooltipText } from '../common/TooltipText';

export const AssetGraphSupply: React.FC<PoolComponentProps> = ({ poolId }) => {
  const theme = useTheme();

  return (
    <>
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
              assetSymbol={''}
              assetApr={0.1888}
              emissionSymbol={''}
              emissionApr={0.0355}
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
              '& .MuiAreaElement-series-Supply': {
                fill: "url('#sGradient')",
              },
              [`& .${axisClasses.right} .${axisClasses.label}`]: {
                transform: 'translateX(10px)',
              },
            }}
            xAxis={[
              {
                data: [3, 26, 47],
                label: 'Utilization rate',
                valueFormatter: (element) => `${element.toFixed(0)}%`,
              },
            ]}
            yAxis={[{ label: 'Interest rate (%)' }]}
            leftAxis={null}
            bottomAxis={{}}
            topAxis={null}
            rightAxis={{}}
            series={[
              {
                id: 'Supply',
                data: [77, 88, 200],
                label: 'APR',
                valueFormatter: (element) => `${element!.toFixed(0)}%`,
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
        </Box>
      </Box>
    </>
  );
};
