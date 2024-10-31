import { Box, Tooltip, Typography, useTheme } from '@mui/material';
import * as formatter from '../../utils/formatter';
import { Icon } from './Icon';

interface ReserveAprParams {
  reserveSymbol: string;
  reserveApr: number;
  emissionApr: number | undefined;
  isSupply: boolean;
}

export const ReserveApr = ({
  reserveSymbol,
  reserveApr,
  emissionApr,
  isSupply,
}: ReserveAprParams) => {
  const theme = useTheme();

  return (
    <Tooltip
      title={
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="body2">Amount earned/charged:</Typography>
          <Typography variant="body2">
            {`${reserveSymbol} ${`${formatter.toPercentage(reserveApr)}`}`}
          </Typography>
          {emissionApr && (
            <Typography variant="body2">{`BLND ${formatter.toPercentage(emissionApr)}`}</Typography>
          )}
          <Typography variant="body2">
            {`Net APR ${formatter.toPercentage(
              isSupply ? (emissionApr ?? 0) + reserveApr : reserveApr - (emissionApr ?? 0)
            )}`}
          </Typography>
        </Box>
      }
      placement="top"
      enterTouchDelay={0}
      enterDelay={500}
      leaveTouchDelay={3000}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography variant="body1">{formatter.toPercentage(reserveApr)}</Typography>

        {emissionApr && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              borderRadius: '5px',
              paddingLeft: '4px',
              paddingRight: '4px',
              gap: '4px',
              background: theme.palette.primary.opaque,
            }}
          >
            <Typography variant="body1" color={theme.palette.primary.main}>
              {formatter.toPercentage(emissionApr)}
            </Typography>
            <Icon
              src="/icons/dashboard/pool_emissions_icon.svg.svg"
              height={`${18}px`}
              width={`${18}px`}
              alt="emzission"
            />
          </Box>
        )}
      </Box>
    </Tooltip>
  );
};
