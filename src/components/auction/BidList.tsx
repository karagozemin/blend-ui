import { Pool } from '@blend-capital/blend-sdk';
import { Box, BoxProps, Typography } from '@mui/material';
import { useSettings, ViewType } from '../../contexts';
import { BidListItem } from './BidListItem';

export interface BidListProps extends BoxProps {
  pool: Pool;
}

export const BidList: React.FC<BidListProps> = ({ pool }) => {
  const { viewType } = useSettings();

  const headerNum = viewType == ViewType.REGULAR ? 6 : 6;
  const headerWidth = `${(100 / headerNum).toFixed(2)}%`;
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        scrollbarColor: 'black grey',
        padding: '6px',
        marginTop: '12px',
      }}
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
        <Typography variant="body2" color="text.secondary" sx={{ marginRight: '48px' }}>
          Bid
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ width: headerWidth }}
        >
          Type
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ width: headerWidth }}
        >
          Amount
        </Typography>
      </Box>
      <BidListItem />
    </Box>
  );
};
