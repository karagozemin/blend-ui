import { Input, Typography } from '@mui/material';
import { SorobanRpc } from '@stellar/stellar-sdk';
import { useState } from 'react';
import { Divider } from '../components/common/Divider';
import { OpaqueButton } from '../components/common/OpaqueButton';
import { Row } from '../components/common/Row';
import { useWallet } from '../contexts/wallet';
import { useStore } from '../store/store';
import theme from '../theme';

export default function NetworkPage() {
  const { getNetworkDetails, walletId } = useWallet();
  const { network, setNetwork } = useStore((state) => state);
  const loadBlendData = useStore((state) => state.loadBlendData);

  const [newNetworkRPCUrl, setNewNetworkRPCUrl] = useState<string>('');
  const [newHorizonUrl, setNewHorizonUrl] = useState<string>('');
  const [newOpts, setNewOpts] = useState<SorobanRpc.Server.Options | undefined>(undefined);

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
      loadBlendData(true);
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
      </>
    </>
  );
}
