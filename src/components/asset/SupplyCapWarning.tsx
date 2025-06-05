import InfoIcon from '@mui/icons-material/InfoOutlined';
import { Box, BoxProps, Tooltip, useTheme } from '@mui/material';

interface SupplyCapWarningParams extends BoxProps {
  symbol: string;
}

export const SupplyCapWarning = ({ symbol, sx }: SupplyCapWarningParams) => {
  const theme = useTheme();
  return (
    <Tooltip
      title={`The supply cap has been reached. No more ${symbol} can be supplied at this time.`}
      placement="top"
      enterTouchDelay={0}
      enterDelay={500}
      leaveTouchDelay={3000}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '30px',
          minWidth: '30px',
          height: '30px',
          minHeight: '30px',
          borderRadius: '50%',
          backgroundColor: theme.palette.warning.opaque,
          color: theme.palette.warning.main,
          ...sx,
        }}
      >
        <InfoIcon sx={{ transform: 'rotate(180deg)' }} />
      </Box>
    </Tooltip>
  );
};
