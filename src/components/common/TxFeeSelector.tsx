import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { Box, BoxProps, Menu, MenuItem, Skeleton, Typography } from '@mui/material';
import React from 'react';
import { useWallet } from '../../contexts/wallet';
import { useFeeStats } from '../../hooks/api';
import theme from '../../theme';
import { CustomButton } from './CustomButton';
export interface TxFeeSelectorProps extends BoxProps {}

export const TxFeeSelector: React.FC<TxFeeSelectorProps> = () => {
  const { txInclusionFee, setTxInclusionFee } = useWallet();
  const { data: feeStats } = useFeeStats();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  if (feeStats === undefined) {
    return <Skeleton />;
  }

  const lowFee = Math.max(parseInt(feeStats.sorobanInclusionFee.p30), 500).toString();
  const mediumFee = Math.max(parseInt(feeStats.sorobanInclusionFee.p60), 2000).toString();
  const highFee = Math.max(parseInt(feeStats.sorobanInclusionFee.p90), 10000).toString();

  switch (txInclusionFee.type) {
    case 'Low':
      if (lowFee !== txInclusionFee.fee) {
        setTxInclusionFee({ type: 'Low', fee: lowFee });
      }
      break;
    case 'Medium':
      if (mediumFee !== txInclusionFee.fee) {
        setTxInclusionFee({ type: 'Medium', fee: mediumFee });
      }
      break;
    case 'High':
      if (highFee !== txInclusionFee.fee) {
        setTxInclusionFee({ type: 'High', fee: highFee });
      }
      break;
  }

  return (
    <>
      <CustomButton
        id="fee-dropdown-button"
        onClick={handleClick}
        sx={{ padding: '4px', '&:hover': { color: 'white' } }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            color: theme.palette.text.secondary,
            '&:hover': { color: 'white' },
          }}
        >
          <Typography variant="h5">Priority Fee: {txInclusionFee.type}</Typography>
          {open ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
        </Box>
      </CustomButton>
      <Menu
        id="fee-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'fee-dropdown-button',
        }}
      >
        <MenuItem
          onClick={() => {
            setTxInclusionFee({ type: 'Low', fee: lowFee });
            handleClose();
          }}
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            borderRadius: '5px',
          }}
        >
          <Typography variant="body1">{`Low (${lowFee} stroops)`}</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setTxInclusionFee({ type: 'Medium', fee: mediumFee });
            handleClose();
          }}
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            borderRadius: '5px',
          }}
        >
          <Typography variant="body1">{`Medium (${mediumFee} stroops)`}</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setTxInclusionFee({ type: 'High', fee: highFee });
            handleClose();
          }}
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            borderRadius: '5px',
          }}
        >
          <Typography variant="body1">{`High (${highFee} stroops)`}</Typography>
        </MenuItem>
      </Menu>
    </>
  );
};
