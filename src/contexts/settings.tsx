import { Network } from '@blend-capital/blend-sdk';
import { useMediaQuery, useTheme } from '@mui/material';
import { rpc } from '@stellar/stellar-sdk';
import { useRouter } from 'next/router';
import React, { useContext, useMemo, useState } from 'react';
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
  version: 'v1' | 'v2';
}

export interface ISettingsContext {
  viewType: ViewType;
  network: Network & { horizonUrl: string };
  setNetwork: (rpcUrl: string, newHorizonUrl: string, opts?: rpc.Server.Options) => void;
  getRPCServer: () => rpc.Server;
  getHorizonServer: () => rpc.Server;
  lastPool: TrackedPool | undefined;
  setLastPool: (id: string, name: string, version: 'v1' | 'v2') => void;
  trackedPools: TrackedPool[];
  trackPool: (id: string, name: string, version: 'v1' | 'v2') => void;
  untrackPool: (id: string) => void;
  showLend: boolean;
  setShowLend: (showLend: boolean) => void;
  showJoinPool: boolean;
  setShowJoinPool: (showJoinPool: boolean) => void;
  blockedPools: string[];
  version: 'v1' | 'v2';
  backstopId: string | undefined;
  setVersion: (version: 'v1' | 'v2') => void;
  getVersion: () => string | undefined;
  isV2Enabled: boolean;
}

const SettingsContext = React.createContext<ISettingsContext | undefined>(undefined);

export const SettingsProvider = ({ children = null as any }) => {
  const theme = useTheme();
  const router = useRouter();
  const compact = useMediaQuery(theme.breakpoints.down('lg')); // hook causes refresh on change
  const mobile = useMediaQuery(theme.breakpoints.down('sm')); // hook causes refresh on change

  const { version: routerVersion } = router.query;

  const [network, setNetwork] = useState<Network & { horizonUrl: string }>({
    rpc: DEFAULT_RPC,
    passphrase: DEFAULT_PASSPHRASE,
    opts: { allowHttp: true },
    horizonUrl: DEFAULT_HORIZON,
  });

  const [lastPoolString, setLastPoolString] = useLocalStorageState('lastPool', undefined);
  const [trackedPoolsString, setTrackedPoolsString] = useLocalStorageState(
    'trackedPools',
    undefined
  );

  const [showLend, setShowLend] = useState<boolean>(true);
  const [showJoinPool, setShowJoinPool] = useState<boolean>(true);

  const lastPool = useMemo(() => {
    try {
      return lastPoolString ? (JSON.parse(lastPoolString) as TrackedPool) : undefined;
    } catch (e) {
      console.warn('Failed to parse lastPool:', e);
      return undefined;
    }
  }, [lastPoolString]);
  const trackedPools = useMemo(() => {
    try {
      return JSON.parse(trackedPoolsString || '[]') as TrackedPool[];
    } catch (e) {
      console.warn('Failed to parse trackedPools:', e);
      return [];
    }
  }, [trackedPoolsString]);
  const [blockedPools, _] = useState<string[]>(
    (process.env.NEXT_PUBLIC_BLOCKED_POOLS || '').split(',')
  );
  const version = routerVersion === 'v1' || routerVersion === 'v2' ? routerVersion : 'v1';

  const backstopId =
    version === 'v1' ? process.env.NEXT_PUBLIC_BACKSTOP : process.env.NEXT_PUBLIC_BACKSTOP_V2;

  const isV2Enabled = process.env.NEXT_PUBLIC_BACKSTOP_V2 !== undefined;

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

  function trackPool(id: string, name: string, version: 'v1' | 'v2') {
    let index = trackedPools.findIndex((pool) => pool.id === id);
    if (index !== -1) {
      if (trackedPools[index].version !== version || trackedPools[index].name !== name) {
        trackedPools[index].version = version;
        trackedPools[index].name = name;
        setTrackedPoolsString(JSON.stringify(trackedPools));
      }
    } else {
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

  function setLastPool(id: string, name: string, version: 'v1' | 'v2') {
    setLastPoolString(JSON.stringify({ id, name, version }));
    if (routerVersion !== version) {
      handleSetVersion(version);
    }
  }

  function handleSetVersion(version: 'v1' | 'v2') {
    router.replace({ query: { ...router.query, version } });
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
        isV2Enabled,
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
