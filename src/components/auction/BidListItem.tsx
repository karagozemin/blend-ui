import { Box, Typography, useTheme } from '@mui/material';
import { useSettings, ViewType } from '../../contexts';
import { PoolHeader } from '../pool/PoolHeader';

export const BidListItem: React.FC = ({ ...props }) => {
  const theme = useTheme();
  const { viewType } = useSettings();

  const tableNum = viewType == ViewType.REGULAR ? 6 : 6;
  const tableWidth = `${(100 / tableNum).toFixed(2)}%`;
  return (
    <Box
      sx={{
        type: 'alt',
        display: 'flex',
        width: '100%',
        padding: '6px',
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
        <Box>
          <PoolHeader name={''} />
        </Box>
        <Box
          sx={{
            width: tableWidth,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Typography variant="body1">TYPE</Typography>
        </Box>
        <Box
          sx={{
            width: tableWidth,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Typography variant="body1">888.888 XXX</Typography>
        </Box>
      </Box>
    </Box>
  );
};
