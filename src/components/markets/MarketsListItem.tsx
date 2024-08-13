import { Reserve } from '@blend-capital/blend-sdk';
import { Box, BoxProps, Typography, useTheme } from '@mui/material';
import { ViewType, useSettings } from '../../contexts';
import * as formatter from '../../utils/formatter';
import { getTokenLinkFromReserve } from '../../utils/token';
import { TokenHeader } from '../common/TokenHeader';
import { StackedApr } from './StackedApr';

export interface MarketsListItemProps extends BoxProps {
  reserveData: Reserve;
}

export const MarketsListItem: React.FC<MarketsListItemProps> = ({ reserveData, sx, ...props }) => {
  const theme = useTheme();
  const { viewType } = useSettings();

  const tableNum = viewType == ViewType.REGULAR ? 6 : 3;
  const tableWidth = `${(100 / tableNum).toFixed(2)}%`;
  return (
    <Box
      sx={{
        type: 'alt',
        display: 'flex',
        width: '100%',
        padding: '6px',
        marginBottom: '12px',
        borderRadius: '5px',
        '&:hover': {
          cursor: 'pointer',
          background: theme.palette.menu.light,
        },
        ...sx,
      }}
      onClick={() => {
        const link = getTokenLinkFromReserve(reserveData);
        window.open(link, '_blank');
      }}
      {...props}
    >
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px',
          type: 'alt',
        }}
      >
        <TokenHeader id={reserveData.assetId} sx={{ width: tableWidth, marginRight: '12px' }} />
        <Box
          sx={{
            width: tableWidth,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Typography variant="body1">
            {formatter.toBalance(reserveData.estimates.supplied)}
          </Typography>
        </Box>
        <Box
          sx={{
            width: tableWidth,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Typography variant="body1">
            {formatter.toBalance(reserveData.estimates.borrowed)}
          </Typography>
        </Box>
        {tableNum >= 6 && (
          <>
            <Box
              sx={{
                width: tableWidth,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Typography variant="body1">
                {formatter.toPercentage(reserveData.config.c_factor / 1e7)}
              </Typography>
            </Box>
            <Box
              sx={{
                width: tableWidth,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Typography variant="body1">
                {formatter.toPercentage(1 / (reserveData.config.l_factor / 1e7))}
              </Typography>
            </Box>
            <Box
              sx={{
                width: tableWidth,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <StackedApr
                aprLend={formatter.toPercentage(reserveData.estimates.supplyApr)}
                aprBorrow={formatter.toPercentage(reserveData.estimates.apr)}
              ></StackedApr>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};
