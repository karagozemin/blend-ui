import { Network } from '@blend-capital/blend-sdk';
import { Horizon, SorobanRpc } from '@stellar/stellar-sdk';
import { StateCreator } from 'zustand';
import { DataStore } from './store';

const DEFAULT_RPC = process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org';
const DEFAULT_HORIZON =
  process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const DEFAULT_PASSPHRASE =
  process.env.NEXT_PUBLIC_PASSPHRASE || 'Test SDF Network ; September 2015';

export interface RPCSlice {
  network: Network & { horizonUrl: string };
  rpcServer: () => SorobanRpc.Server;
  setNetwork: (rpcUrl: string, newHorizonUrl: string, opts?: SorobanRpc.Server.Options) => void;
  horizonServer: () => Horizon.Server;
}

export const createRPCSlice: StateCreator<DataStore, [], [], RPCSlice> = (set, get) => ({
  network: {
    rpc: DEFAULT_RPC,
    passphrase: DEFAULT_PASSPHRASE,
    opts: undefined,
    horizonUrl: DEFAULT_HORIZON,
  },
  rpcServer: () => {
    let network = get().network;
    return new SorobanRpc.Server(network.rpc, network.opts);
  },
  setNetwork: (newUrl: string, newHorizonUrl: string, newOpts?: SorobanRpc.Server.Options) =>
    set({
      network: {
        rpc: newUrl,
        passphrase: DEFAULT_PASSPHRASE,
        opts: newOpts,
        horizonUrl: newHorizonUrl,
      },
    }),
  horizonServer: () => {
    let network = get().network;
    return new Horizon.Server(network.horizonUrl, network.opts);
  },
});
