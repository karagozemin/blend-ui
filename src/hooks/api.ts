import {
  Backstop,
  BackstopPool,
  BackstopPoolUser,
  Pool,
  PoolOracle,
  PoolUser,
  Positions,
  Reserve,
  UserBalance,
} from '@blend-capital/blend-sdk';
import { Address, Asset, Horizon, SorobanRpc } from '@stellar/stellar-sdk';
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useSettings } from '../contexts';
import { useWallet } from '../contexts/wallet';
import { getTokenMetadataFromTOML, StellarTokenMetadata } from '../external/stellar-toml';
import { getTokenBalance } from '../external/token';

const DEFAULT_STALE_TIME = 30 * 1000;
const USER_STALE_TIME = 60 * 1000;
const BACKSTOP_ID = process.env.NEXT_PUBLIC_BACKSTOP || '';

//********** Query Client Data **********//

export function useQueryClientCacheCleaner(): {
  cleanWalletCache: () => void;
  cleanBackstopCache: () => void;
  cleanPoolCache: (poolId: string) => void;
  cleanBackstopPoolCache: (poolId: string) => void;
} {
  const queryClient = useQueryClient();

  const cleanWalletCache = () => {
    queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] === 'balance',
    });
    queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] === 'account',
    });
  };

  const cleanBackstopCache = () => {
    queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] === 'backstop',
    });
  };

  const cleanPoolCache = (poolId: string) => {
    queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] === 'pool' && query.queryKey[1] === poolId,
    });
    queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] === 'poolPositions' && query.queryKey[1] === poolId,
    });
  };

  const cleanBackstopPoolCache = (poolId: string) => {
    queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] === 'backstop',
    });
    queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] === 'backstopPool' && query.queryKey[1] === poolId,
    });
    queryClient.invalidateQueries({
      predicate: (query) =>
        query.queryKey[0] === 'backstopPoolUser' && query.queryKey[1] === poolId,
    });
  };

  return { cleanWalletCache, cleanBackstopCache, cleanPoolCache, cleanBackstopPoolCache };
}

//********** Chain Data **********//

/**
 * Fetches the current block number from the RPC server.
 * @returns Query result with the current block number.
 */
export function useCurrentBlockNumber(): UseQueryResult<number, Error> {
  const { getRPCServer } = useSettings();
  return useQuery({
    staleTime: 5 * 1000,
    queryKey: ['blockNumber'],
    queryFn: async () => {
      const rpc = getRPCServer();
      const data = await rpc.getLatestLedger();
      return data.sequence;
    },
  });
}

//********** Pool Data **********//

/**
 * Fetches pool data for the given pool ID.
 * @param poolId - The pool ID
 * @param enabled - Whether the query is enabled (optional - defaults to true)
 * @returns Query result with the pool data.
 */
export function usePool(poolId: string, enabled: boolean = true): UseQueryResult<Pool, Error> {
  const { network } = useSettings();
  return useQuery({
    staleTime: DEFAULT_STALE_TIME,
    queryKey: ['pool', poolId],
    enabled: enabled && poolId !== '',
    queryFn: async () => {
      return await Pool.load(network, poolId);
    },
  });
}

/**
 * Fetch the oracle data for the given pool.
 * @param pool - The pool
 * @param enabled - Whether the query is enabled (optional - defaults to true)
 * @returns Query result with the oracle data.
 */
export function usePoolOracle(
  pool: Pool | undefined,
  enabled: boolean = true
): UseQueryResult<PoolOracle, Error> {
  return useQuery({
    staleTime: DEFAULT_STALE_TIME,
    queryKey: ['poolOracle', pool?.id],
    enabled: pool !== undefined && enabled,
    queryFn: async () => {
      if (pool !== undefined) {
        return await pool.loadOracle();
      }
    },
  });
}

/**
 * Fetch the user for the given pool and connected wallet.
 * @param poolId - The pool ID
 * @param enabled - Whether the query is enabled (optional - defaults to true)
 * @returns Query result with the user positions.
 */
export function usePoolUser(
  pool: Pool | undefined,
  enabled: boolean = true
): UseQueryResult<PoolUser, Error> {
  const { walletAddress, connected } = useWallet();
  return useQuery({
    staleTime: USER_STALE_TIME,
    queryKey: ['poolPositions', pool?.id, walletAddress],
    enabled: enabled && pool !== undefined && connected,
    placeholderData: new PoolUser(
      walletAddress,
      new Positions(new Map(), new Map(), new Map()),
      new Map()
    ),
    queryFn: async () => {
      if (pool !== undefined && walletAddress !== '') {
        return await pool.loadUser(walletAddress);
      }
    },
  });
}

//********** Backstop Data **********//

/**
 * Fetches the backstop data.
 * @param enabled - Whether the query is enabled (optional - defaults to true)
 * @returns Query result with the backstop data.
 */
export function useBackstop(enabled: boolean = true): UseQueryResult<Backstop, Error> {
  const { network } = useSettings();
  return useQuery({
    staleTime: DEFAULT_STALE_TIME,
    queryKey: ['backstop'],
    enabled,
    queryFn: async () => {
      return await Backstop.load(network, BACKSTOP_ID);
    },
  });
}

/**
 * Fetch the backstop pool data for the given pool ID.
 * @param poolId - The pool ID
 * @param enabled - Whether the query is enabled (optional - defaults to true)
 * @returns Query result with the backstop pool data.
 */
export function useBackstopPool(
  poolId: string,
  enabled: boolean = true
): UseQueryResult<BackstopPool, Error> {
  const { network } = useSettings();
  return useQuery({
    staleTime: DEFAULT_STALE_TIME,
    queryKey: ['backstopPool', poolId],
    enabled,
    queryFn: async () => {
      return await BackstopPool.load(network, BACKSTOP_ID, poolId);
    },
  });
}

/**
 * Fetch the backstop pool user data for the given pool and connected wallet.
 * @param poolId - The pool ID
 * @param enabled - Whether the query is enabled (optional - defaults to true)
 * @returns Query result with the backstop pool user data.
 */
export function useBackstopPoolUser(
  poolId: string,
  enabled: boolean = true
): UseQueryResult<BackstopPoolUser, Error> {
  const { network } = useSettings();
  const { walletAddress, connected } = useWallet();
  return useQuery({
    staleTime: USER_STALE_TIME,
    queryKey: ['backstopPoolUser', poolId, walletAddress],
    enabled: enabled && connected,
    placeholderData: new BackstopPoolUser(
      walletAddress,
      poolId,
      new UserBalance(BigInt(0), [], BigInt(0), BigInt(0)),
      undefined
    ),
    queryFn: async () => {
      if (walletAddress !== '') {
        return await BackstopPoolUser.load(network, BACKSTOP_ID, poolId, walletAddress);
      }
    },
  });
}

//********** General User Data **********//

/**
 * Fetch the account from Horizon for the connected wallet.
 * @param enabled - Whether the query is enabled (optional - defaults to true)
 * @returns Query result with the account data.
 */
export function useHorizonAccount(
  enabled: boolean = true
): UseQueryResult<Horizon.AccountResponse> {
  const { walletAddress, connected } = useWallet();
  const { network } = useSettings();
  return useQuery({
    staleTime: USER_STALE_TIME,
    queryKey: ['account', walletAddress],
    enabled: enabled && connected,
    queryFn: async () => {
      if (walletAddress !== '') {
        let horizon = new Horizon.Server(network.horizonUrl, network.opts);
        return await horizon.loadAccount(walletAddress);
      }
    },
  });
}

/**
 * Fetch the token balance for the given token ID and connected wallet.
 * Will use the Horizon account data if available.
 * @param tokenId - The token ID
 * @param asset - The Stellar asset
 * @param account - The Horizon account data
 * @param enabled - Whether the query is enabled (optional - defaults to true)
 * @returns Query result with the token balance.
 */
export function useTokenBalance(
  tokenId: string | undefined,
  asset?: Asset | undefined,
  account?: Horizon.AccountResponse | undefined,
  enabled: boolean = true
): UseQueryResult<bigint> {
  const { walletAddress, connected } = useWallet();
  const { network } = useSettings();
  return useQuery({
    staleTime: USER_STALE_TIME,
    queryKey: ['balance', tokenId, walletAddress],
    enabled: enabled && connected,
    queryFn: async () => {
      if (walletAddress !== '') {
        if (tokenId === undefined || tokenId === '') {
          return BigInt(0);
        }
        if (account !== undefined && asset !== undefined) {
          let balance_line = account.balances.find((balance) => {
            if (balance.asset_type == 'native') {
              // @ts-ignore
              return asset.isNative();
            }
            return (
              // @ts-ignore
              balance.asset_code === asset.getCode() &&
              // @ts-ignore
              balance.asset_issuer === asset.getIssuer()
            );
          });
          if (balance_line !== undefined) {
            return BigInt(balance_line.balance.replace('.', ''));
          }
        }
        let rpc = new SorobanRpc.Server(network.rpc, network.opts);
        return await getTokenBalance(rpc, network.passphrase, tokenId, new Address(walletAddress));
      }
    },
  });
}

//********** Misc Data **********//

/**
 * Fetch the token metadata for the given reserve.
 * @param reserve - The reserve
 * @param enabled - Whether the query is enabled (optional - defaults to true)
 * @returns Query result with the token metadata.
 */
export function useTokenMetadataFromToml(
  reserve: Reserve,
  enabled: boolean = true
): UseQueryResult<StellarTokenMetadata, Error> {
  const { network } = useSettings();
  return useQuery({
    staleTime: Infinity,
    queryKey: ['tokenMetadata', reserve.assetId],
    enabled,
    queryFn: async () => {
      const horizon = new Horizon.Server(network.horizonUrl, network.opts);
      return await getTokenMetadataFromTOML(horizon, reserve);
    },
  });
}
