import { Network } from '@blend-capital/blend-sdk';
import { useMediaQuery, useTheme } from '@mui/material';
import { rpc } from '@stellar/stellar-sdk';
import React, { useContext, useState } from 'react';
import { useLocalStorageState } from '../hooks';

const DEFAULT_RPC = process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org';
const DEFAULT_HORIZON =
  process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const DEFAULT_PASSPHRASE =
  process.env.NEXT_PUBLIC_PASSPHRASE || 'Test SDF Network ; September 2015';

export enum ViewType {
  MOBILE,
  COMPACT,
  REGULAR,
}

export interface TrackedPool {
  id: string;
  name: string;
}

export interface ISettingsContext {
  viewType: ViewType;
  network: Network & { horizonUrl: string };
  setNetwork: (rpcUrl: string, newHorizonUrl: string, opts?: rpc.Server.Options) => void;
  getRPCServer: () => rpc.Server;
  getHorizonServer: () => rpc.Server;
  lastPool: string | undefined;
  setLastPool: (poolId: string) => void;
  trackedPools: TrackedPool[];
  trackPool: (id: string, name: string | undefined) => void;
  untrackPool: (id: string) => void;
  showLend: boolean;
  setShowLend: (showLend: boolean) => void;
  showJoinPool: boolean;
  setShowJoinPool: (showJoinPool: boolean) => void;
  blockedPools: string[];
  version: string | undefined;
  backstopId: string | undefined;
  setVersion: (version: 'V1' | 'V2') => void;
  getVersion: () => string | undefined;
}

const SettingsContext = React.createContext<ISettingsContext | undefined>(undefined);

export const SettingsProvider = ({ children = null as any }) => {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down('lg')); // hook causes refresh on change
  const mobile = useMediaQuery(theme.breakpoints.down('sm')); // hook causes refresh on change

  const [network, setNetwork] = useState<Network & { horizonUrl: string }>({
    rpc: DEFAULT_RPC,
    passphrase: DEFAULT_PASSPHRASE,
    opts: { allowHttp: true },
    horizonUrl: DEFAULT_HORIZON,
  });

  const [version, setVersion] = useLocalStorageState('version', 'V1');
  const [lastPool, setLastPool] = useLocalStorageState('lastPool', undefined);

  const [showLend, setShowLend] = useState<boolean>(true);
  const [showJoinPool, setShowJoinPool] = useState<boolean>(true);
  const [trackedPoolsString, setTrackedPoolsString] = useLocalStorageState(
    'trackedPools',
    undefined
  );

  const trackedPools = JSON.parse(trackedPoolsString || '[]') as TrackedPool[];
  const [blockedPools, setBlockedPools] = useState<string[]>(
    (process.env.NEXT_PUBLIC_BLOCKED_POOLS || '').split(',')
  );

  const backstopId =
    version === 'V1' ? process.env.NEXT_PUBLIC_BACKSTOP : process.env.NEXT_PUBLIC_BACKSTOP_V2;

  let viewType: ViewType;
  if (mobile) viewType = ViewType.MOBILE;
  else if (compact) viewType = ViewType.COMPACT;
  else viewType = ViewType.REGULAR;

  function handleSetNetwork(newRpcUrl: string, newHorizonUrl: string, opts?: rpc.Server.Options) {
    setNetwork({ rpc: newRpcUrl, passphrase: DEFAULT_PASSPHRASE, opts, horizonUrl: newHorizonUrl });
  }

  function getRPCServer() {
    return new rpc.Server(network.rpc, network.opts);
  }

  function getHorizonServer() {
    return new rpc.Server(network.horizonUrl, network.opts);
  }

  function trackPool(id: string, name: string | undefined) {
    if (name !== undefined) {
      if (trackedPools.find((pool) => pool.id === id)) return;
      setTrackedPoolsString(JSON.stringify([...trackedPools, { id, name }]));
    }
  }

  function untrackPool(id: string) {
    const index = trackedPools.findIndex((pool) => pool.id === id);
    if (index !== -1) {
      trackedPools.splice(index, 1);
      setTrackedPoolsString(JSON.stringify(trackedPools));
    }
  }

  function handleSetVersion(version: 'V1' | 'V2') {
    setVersion(version);
  }

  function getVersion() {
    return version;
  }

  return (
    <SettingsContext.Provider
      value={{
        viewType,
        network,
        setNetwork: handleSetNetwork,
        getRPCServer,
        getHorizonServer,
        lastPool,
        setLastPool,
        trackedPools,
        trackPool,
        untrackPool,
        showLend,
        setShowLend,
        showJoinPool,
        setShowJoinPool,
        blockedPools,
        version,
        backstopId,
        setVersion: handleSetVersion,
        getVersion,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('Component rendered outside the provider tree');
  }

  return context;
};
