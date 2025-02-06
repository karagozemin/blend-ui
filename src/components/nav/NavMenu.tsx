import MenuIcon from '@mui/icons-material/Menu';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  Alert,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Typography,
  useTheme,
} from '@mui/material';
import Link from 'next/link';
import React from 'react';
import { useSettings, ViewType } from '../../contexts';
import { useBackstop } from '../../hooks/api';
import { ToggleSlider } from '../common/ToggleSlider';
import { NavItem } from './NavItem';

export const NavMenu = () => {
  const theme = useTheme();
  const { viewType, lastPool, version, setVersion } = useSettings();

  const { data: backstop } = useBackstop();
  const poolId = (lastPool ? lastPool.id : backstop?.config?.rewardZone[0]) ?? '';
  const safePoolId = typeof poolId == 'string' && /^[0-9A-Z]{56}$/.test(poolId) ? poolId : '';
  const lastVersion = lastPool ? lastPool.version : version;

  const [openCon, setOpenCon] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSnackClose = () => {
    setOpenCon(false);
  };

  return (
    <>
      <IconButton
        id="nav-dropdown-button"
        onClick={handleClick}
        sx={{ width: '100%', height: '100%', color: theme.palette.text.secondary }}
      >
        <MenuIcon />
      </IconButton>
      {viewType === ViewType.REGULAR && (
        <Menu
          id="nav-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            'aria-labelledby': 'pool-dropdown-button',
          }}
          PaperProps={{
            // @ts-ignore - TODO: Figure out why typing is broken
            backgroundColor: theme.palette.menu.main,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Typography variant="subtitle2" sx={{}}>
              Select Blend Version
            </Typography>
            <ToggleSlider
              options={['1', '2']}
              selected={version ?? '1'}
              palette={theme.palette.positive}
              changeState={setVersion}
            ></ToggleSlider>
          </Box>

          <Link href={`/auction/?poolId=${safePoolId}`}>
            <MenuItem onClick={handleClose} sx={{ color: '#FFFFFF' }}>
              Auctions
            </MenuItem>
          </Link>
          <a href="https://core.allbridge.io/" target="_blank" rel="noreferrer">
            <MenuItem
              onClick={handleClose}
              sx={{ color: '#FFFFFF', justifyContent: 'space-between' }}
            >
              <Typography>Bridge USDC</Typography>
              <OpenInNewIcon fontSize="inherit" />
            </MenuItem>
          </a>
          <Link href="/settings">
            <MenuItem onClick={handleClose} sx={{ color: '#FFFFFF' }}>
              Settings
            </MenuItem>
          </Link>
          <a href="https://docs.blend.capital/" target="_blank" rel="noreferrer">
            <MenuItem
              onClick={handleClose}
              sx={{ color: '#FFFFFF', justifyContent: 'space-between' }}
            >
              <Typography>Docs</Typography>
              <OpenInNewIcon fontSize="inherit" />
            </MenuItem>
          </a>
          <a href="https://github.com/blend-capital" target="_blank" rel="noreferrer">
            <MenuItem
              onClick={handleClose}
              sx={{ color: '#FFFFFF', justifyContent: 'space-between' }}
            >
              <Typography>Github</Typography>
              <OpenInNewIcon fontSize="inherit" />
            </MenuItem>
          </a>
          <Link href="/termsofservice">
            <MenuItem onClick={handleClose} sx={{ color: '#FFFFFF' }}>
              Terms of Service
            </MenuItem>
          </Link>
        </Menu>
      )}
      {viewType !== ViewType.REGULAR && (
        <Menu
          id="nav-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            'aria-labelledby': 'pool-dropdown-button',
          }}
          PaperProps={{
            // @ts-ignore - TODO: Figure out why typing is broken
            backgroundColor: theme.palette.menu.main,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'left',
            }}
          >
            <Typography variant="subtitle2" sx={{ width: '90%', marginLeft: '6px' }}>
              Select Blend Version
            </Typography>
            <ToggleSlider
              options={['V1', 'V2']}
              selected={version ?? 'V1'}
              palette={theme.palette.positive}
              changeState={setVersion}
              sx={{ width: '90%' }}
            ></ToggleSlider>
          </Box>
          <NavItem
            onClick={handleClose}
            to={{ pathname: '/', query: { poolId: poolId, version: lastVersion } }}
            title="Markets"
            sx={{ width: '90%', justifyContent: 'left', marginBottom: '6px' }}
          />
          <NavItem
            onClick={handleClose}
            to={{ pathname: '/dashboard', query: { poolId: poolId, version: lastVersion } }}
            title="Dashboard"
            sx={{ width: '90%', justifyContent: 'left', marginBottom: '6px' }}
          />
          <NavItem
            onClick={handleClose}
            to={{ pathname: '/backstop', query: { poolId: poolId, version: lastVersion } }}
            title="Backstop"
            sx={{ width: '90%', justifyContent: 'left', marginBottom: '6px' }}
          />
          <NavItem
            onClick={handleClose}
            to={{ pathname: '/auction', query: { poolId: poolId, version: lastVersion } }}
            title="Auctions"
            sx={{ width: '90%', justifyContent: 'left', marginBottom: '6px' }}
          />
          <a href="https://core.allbridge.io/" target="_blank" rel="noreferrer">
            <MenuItem
              onClick={handleClose}
              sx={{ color: '#FFFFFF', justifyContent: 'space-between' }}
            >
              <Typography>Bridge USDC</Typography>
              <OpenInNewIcon fontSize="inherit" />
            </MenuItem>
          </a>
          <Link href="/settings">
            <MenuItem onClick={handleClose} sx={{ color: '#FFFFFF' }}>
              Settings
            </MenuItem>
          </Link>
          <a href="https://docs.blend.capital/" target="_blank" rel="noreferrer">
            <MenuItem
              onClick={handleClose}
              sx={{ color: '#FFFFFF', justifyContent: 'space-between' }}
            >
              <Typography>Docs</Typography>
              <OpenInNewIcon fontSize="inherit" />
            </MenuItem>
          </a>
          <a href="https://github.com/blend-capital" target="_blank" rel="noreferrer">
            <MenuItem
              onClick={handleClose}
              sx={{ color: '#FFFFFF', justifyContent: 'space-between' }}
            >
              <Typography>Github</Typography>
              <OpenInNewIcon fontSize="inherit" />
            </MenuItem>
          </a>
          <Link href="/termsofservice">
            <MenuItem onClick={handleClose} sx={{ color: '#FFFFFF' }}>
              Terms of Service
            </MenuItem>
          </Link>
        </Menu>
      )}

      <Snackbar
        open={openCon}
        autoHideDuration={4000}
        onClose={handleSnackClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <Alert
          onClose={handleClose}
          severity="info"
          sx={{
            backgroundColor: theme.palette.info.opaque,
            alignItems: 'center',
            width: '100%',
          }}
        >
          Wallet already received funds.
        </Alert>
      </Snackbar>
    </>
  );
};
