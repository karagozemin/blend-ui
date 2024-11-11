import { Reserve } from '@blend-capital/blend-sdk';
import { Box, BoxProps, Typography, useTheme } from '@mui/material';
import { ViewType, useSettings } from '../../contexts';
import * as formatter from '../../utils/formatter';
import { getTokenLinkFromReserve } from '../../utils/token';
import { TokenHeader } from '../common/TokenHeader';
import { StackedApr } from './StackedApr';

export interface MarketsListItemProps extends BoxProps {
  reserve: Reserve;
}

export const MarketsListItem: React.FC<MarketsListItemProps> = ({ reserve, sx, ...props }) => {
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
        const link = getTokenLinkFromReserve(reserve);
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
          type: 'alt',
        }}
      >
        <TokenHeader reserve={reserve} sx={{ width: tableWidth }} />
        <Box
          sx={{
            width: tableWidth,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Typography variant="body1">{formatter.toBalance(reserve.totalSupplyFloat())}</Typography>
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
            {formatter.toBalance(reserve.totalLiabilitiesFloat())}
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
                {formatter.toPercentage(reserve.config.c_factor / 1e7)}
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
                {formatter.toPercentage(1 / (reserve.config.l_factor / 1e7))}
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
                aprLend={formatter.toPercentage(reserve.supplyApr)}
                aprBorrow={formatter.toPercentage(reserve.borrowApr)}
              ></StackedApr>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};
