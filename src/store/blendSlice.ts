import { Backstop, Pool, Reserve } from '@blend-capital/blend-sdk';
import { Asset } from '@stellar/stellar-sdk';
import { StateCreator } from 'zustand';
import { StellarTokenMetadata, getTokenMetadataFromTOML } from '../external/stellar-toml';
import { BLND_ASSET, USDC_ASSET } from '../utils/token_display';
import { DataStore } from './store';

/**
 * Ledger state for the Blend protocol
 */
export interface BlendSlice {
  backstop: Backstop | undefined;
  pools: Map<string, Pool>;
  assetStellarMetadata: Map<string, StellarTokenMetadata>;
  latestLedger: number;
  latestLedgerTimestamp: number;
  loadDataPromise: Promise<void> | undefined;

  loadBlendData: (force_update: boolean, pool_id?: string, user_id?: string) => Promise<void>;
}

export const createBlendSlice: StateCreator<DataStore, [], [], BlendSlice> = (set, get) => ({
  backstop: undefined,
  pools: new Map<string, Pool>(),
  assetStellarMetadata: new Map<string, StellarTokenMetadata>(),
  latestLedger: 0,
  latestLedgerTimestamp: 0,
  loadDataPromise: undefined,

  loadBlendData: async (force_update: boolean, pool_id?: string, user_id?: string) => {
    const loadDataPromise = get().loadDataPromise;
    if (loadDataPromise !== undefined) {
      return loadDataPromise;
    }
    const newPromise = new Promise<void>(async (resolve) => {
      try {
        const network = get().network;
        // get latest ledger close time (TODO: File issue to include close time on getLatestLedger)
        const rpc = get().rpcServer();
        let tx_response = await rpc.getTransaction(
          '0000000000000000000000000000000000000000000000000000000000000000'
        );
        let latest_ledger = Number(tx_response.latestLedger);
        let latest_ledger_close = Number(tx_response.latestLedgerCloseTime);

        if (
          !force_update &&
          get().backstop !== undefined &&
          latest_ledger_close < get().latestLedgerTimestamp + 30
        ) {
          return;
        }

        let backstop = await Backstop.load(
          network,
          process.env.NEXT_PUBLIC_BACKSTOP || '',
          pool_id ? [pool_id] : [],
          true,
          latest_ledger_close
        );

        // all pools in the reward zone + the request pools are loaded on the backstop
        let horizonServer = get().horizonServer();
        let pools = new Map<string, Pool>();
        let assetStellarMetadata = new Map<string, StellarTokenMetadata>();
        let pool_array = Array.from(backstop.pools.keys()).reverse();
        // let pool_array = ['CAJTL7ZHMQ5NAFIRYZ2TUZQMOXO6PDNJBFXTIMQRA4TKQQ3XVX6ZYRZP'];
        for (let pool of pool_array) {
          try {
            let pool_data = await Pool.load(network, pool, latest_ledger_close);
            for (let reserve of Array.from(pool_data.reserves.values())) {
              if (!assetStellarMetadata.has(reserve.assetId)) {
                let metadata = await getTokenMetadataFromTOML(horizonServer, reserve);
                assetStellarMetadata.set(reserve.assetId, metadata);
              }
            }
            pools.set(pool, pool_data);
          } catch (e) {
            console.error('Unable to load pool data for pool ' + pool);
            console.error(e);
          }
        }

        // fetch XLM, USDC, and BLND metadata if needed
        const usdcAssetId = USDC_ASSET.contractId(network.passphrase);
        if (!assetStellarMetadata.has(usdcAssetId)) {
          let metadata = await getTokenMetadataFromTOML(horizonServer, {
            assetId: usdcAssetId,
            tokenMetadata: {
              asset: USDC_ASSET,
              name: USDC_ASSET.code,
              symbol: USDC_ASSET.code,
              decimals: 7,
            },
          } as Reserve);
          assetStellarMetadata.set(usdcAssetId, metadata);
        }

        const blndAssetId = BLND_ASSET.contractId(network.passphrase);
        if (!assetStellarMetadata.has(blndAssetId)) {
          let metadata = await getTokenMetadataFromTOML(horizonServer, {
            assetId: blndAssetId,
            tokenMetadata: {
              asset: BLND_ASSET,
              name: BLND_ASSET.code,
              symbol: BLND_ASSET.code,
              decimals: 7,
            },
          } as Reserve);
          assetStellarMetadata.set(blndAssetId, metadata);
        }

        const XLM: Asset = Asset.native();
        const xlmAssetId = XLM.contractId(network.passphrase);
        if (!assetStellarMetadata.has(xlmAssetId)) {
          let metadata = await getTokenMetadataFromTOML(horizonServer, {
            assetId: xlmAssetId,
            tokenMetadata: {
              asset: XLM,
              name: XLM.code,
              symbol: XLM.code,
              decimals: 7,
            },
          } as Reserve);
          assetStellarMetadata.set(xlmAssetId, metadata);
        }

        set({
          backstop,
          pools,
          assetStellarMetadata,
          latestLedger: latest_ledger,
          latestLedgerTimestamp: latest_ledger_close,
        });

        // load data into user slice after an updated, if a user is specified
        if (user_id) {
          await get().loadUserData(user_id);
        }
      } catch (e) {
        console.error('Unable to load Blend data');
        console.error(e);
      } finally {
        set({ loadDataPromise: undefined });
        resolve();
      }
    });
    set({ loadDataPromise: newPromise });
    return newPromise;
  },
});
