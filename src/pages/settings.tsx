import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { Box, Input, Typography } from '@mui/material';
import { rpc } from '@stellar/stellar-sdk';
import { useEffect, useState } from 'react';
import { Divider } from '../components/common/Divider';
import { OpaqueButton } from '../components/common/OpaqueButton';
import { Row } from '../components/common/Row';
import { TrackedPool } from '../components/pool/TrackedPool';
import { useSettings } from '../contexts';
import { useWallet } from '../contexts/wallet';
import { usePoolMeta } from '../hooks/api';
import theme from '../theme';

export default function SettingsPage() {
  const { getNetworkDetails, walletId } = useWallet();
  const { network, setNetwork, trackPool, untrackPool, trackedPools } = useSettings();

  const [newNetworkRPCUrl, setNewNetworkRPCUrl] = useState<string>('');
  const [newHorizonUrl, setNewHorizonUrl] = useState<string>('');
  const [newOpts, setNewOpts] = useState<rpc.Server.Options | undefined>(undefined);
  const [poolToAdd, setPoolToAdd] = useState<string>('');
  const [poolIdError, setPoolIdError] = useState('');

  const { data: poolMeta } = usePoolMeta(poolToAdd, poolToAdd.length > 0);

  function fetchFromWallet() {
    getNetworkDetails().then((networkDetails) => {
      if (networkDetails.rpc) {
        handleChangeRpcUrl(networkDetails.rpc);
        setNewHorizonUrl(networkDetails.horizonUrl);
      }
    });
  }

  function handleUpdateNetworkClick() {
    if (newNetworkRPCUrl && newHorizonUrl) {
      setNetwork(newNetworkRPCUrl, newHorizonUrl, newOpts);
      setNewHorizonUrl('');
      setNewNetworkRPCUrl('');
      setNewOpts(undefined);
    }
  }

  function handleChangeRpcUrl(rpcUrl: string) {
    if (rpcUrl.startsWith('http://')) {
      setNewOpts({ allowHttp: true });
    } else {
      setNewOpts(undefined);
    }
    setNewNetworkRPCUrl(rpcUrl);
  }

  function handleAddTrackedPool(poolId: string) {
    if (poolMeta && poolMeta.id === poolId) {
      trackPool(poolMeta);
      setPoolToAdd('');
    } else {
      setPoolIdError('Pool not found.');
    }
  }

  function handleChangePoolToAdd(poolId: string) {
    setPoolToAdd(poolId);
  }
  const validatePoolId = (poolId: string) => {
    const safePoolId =
      typeof poolId == 'string' && /^[0-9A-Z]{56}$/.test(poolId) ? poolId : undefined;
    if (poolId.length === 0) {
      setPoolIdError('');
      return;
    }

    if (!safePoolId) {
      setPoolIdError(
        'Invalid contract address. Contract addresses begin with "C" and are 56 characters long.'
      );
    } else if (trackedPools.find((pool) => pool.id === safePoolId)) {
      setPoolIdError('Pool is already tracked.');
      return;
    } else {
      setPoolIdError('');
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      validatePoolId(poolToAdd);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [poolToAdd, trackedPools]);

  return (
    <>
      <>
        <Row sx={{ margin: '12px', padding: '12px' }}>
          <Typography variant="h1">Network Configuration</Typography>
        </Row>
        <Divider />
        {!!network.rpc && (
          <Row sx={{ gap: '1rem', flexDirection: 'column', margin: '12px', padding: '12px' }}>
            <Typography variant="h2">Current Network Details</Typography>
            <Typography variant="h3">RPC Url</Typography>
            <Typography variant="h4" sx={{ color: theme.palette.text.secondary }}>
              {network.rpc}
            </Typography>
            <Typography variant="h3">Horizon Url</Typography>
            <Typography variant="h4" sx={{ color: theme.palette.text.secondary }}>
              {network.horizonUrl}
            </Typography>
          </Row>
        )}
        <Divider />
        <Row
          sx={{
            flexDirection: 'column',
            gap: '1rem',
            alignItems: 'start',
            margin: '12px',
            padding: '12px',
          }}
        >
          <Typography variant="h2">Update Network Details</Typography>

          <Row sx={{ flexDirection: 'column', display: 'flex', gap: '1rem' }}>
            <Input
              placeholder="Input RPC Url"
              type="text"
              value={newNetworkRPCUrl}
              onChange={(e) => handleChangeRpcUrl(e.target.value)}
            />
            <Input
              placeholder="Input Horizon Url"
              type="text"
              value={newHorizonUrl}
              onChange={(e) => setNewHorizonUrl(e.target.value)}
            />
            {walletId === 'freighter' && (
              <OpaqueButton
                sx={{ width: '20rem', margin: 'auto' }}
                palette={{
                  main: theme.palette.text.primary,
                  opaque: theme.palette.menu.light,
                  contrastText: theme.palette.text.primary,
                  light: theme.palette.text.secondary,
                  dark: theme.palette.text.secondary,
                }}
                onClick={fetchFromWallet}
              >
                Fetch from Wallet
              </OpaqueButton>
            )}
            <OpaqueButton
              sx={{ width: '20rem', margin: 'auto' }}
              palette={theme.palette.primary}
              onClick={handleUpdateNetworkClick}
            >
              Update
            </OpaqueButton>
          </Row>
        </Row>
        <Row sx={{ margin: '12px', padding: '12px' }}>
          <Typography variant="h1">Tracked Pools</Typography>
        </Row>
        <Divider />
        {trackedPools.length > 0 &&
          trackedPools.map((pool) => (
            <Box
              key={pool.id}
              sx={{
                width: '100%',
                display: 'flex',
                marginBottom: '6px',
                paddingBottom: '6px',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: '5px',
              }}
            >
              <TrackedPool
                key={pool.id}
                name={pool.name}
                id={pool.id}
                version={pool.version}
                sx={{ flex: 1 }}
              />
              <OpaqueButton
                onClick={() => untrackPool(pool.id)}
                palette={theme.palette.error}
                sx={{ display: 'flex', alignSelf: 'center' }}
              >
                <RemoveCircleOutlineIcon />
              </OpaqueButton>
            </Box>
          ))}
        <Row
          sx={{
            flexDirection: 'column',
            gap: '1rem',
            alignItems: 'start',
            margin: '12px',
            padding: '12px',
          }}
        >
          <Typography variant="h2">Add Tracked Pool</Typography>

          <Row sx={{ flexDirection: 'column', display: 'flex', gap: '1rem' }}>
            <Input
              placeholder="Pool Address (C....)"
              type="text"
              value={poolToAdd}
              onChange={(e) => handleChangePoolToAdd(e.target.value)}
              error={!!poolIdError}
            />
            {poolIdError && (
              <Typography variant="body2" color="error">
                {poolIdError}
              </Typography>
            )}
            <OpaqueButton
              sx={{ width: '20rem', margin: 'auto' }}
              palette={theme.palette.primary}
              onClick={() => handleAddTrackedPool(poolToAdd)}
              disabled={!!poolIdError}
            >
              Add
            </OpaqueButton>
          </Row>
        </Row>
      </>
    </>
  );
}
