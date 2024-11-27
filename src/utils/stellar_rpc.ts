import {
  Account,
  Address,
  Contract,
  rpc,
  scValToBigInt,
  TransactionBuilder,
  xdr,
} from '@stellar/stellar-sdk';

export async function createTxBuilder(
  stellar_rpc: rpc.Server,
  network: string,
  source: string
): Promise<TransactionBuilder> {
  try {
    let account = await stellar_rpc.getAccount(source);
    return new TransactionBuilder(account, {
      fee: '1000',
      timebounds: { minTime: 0, maxTime: 0 },
      networkPassphrase: network,
    });
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export async function getOraclePrice(
  stellar_rpc: rpc.Server,
  network_passphrase: string,
  oracle_id: string,
  token_id: string,
  decimals: number
): Promise<number> {
  try {
    // account does not get validated during simulateTx
    let account = new Account('GANXGJV2RNOFMOSQ2DTI3RKDBAVERXUVFC27KW3RLVQCLB3RYNO3AAI4', '123');
    let tx_builder = new TransactionBuilder(account, {
      fee: '1000',
      timebounds: { minTime: 0, maxTime: 0 },
      networkPassphrase: network_passphrase,
    });
    let asset = xdr.ScVal.scvVec([
      xdr.ScVal.scvSymbol('Stellar'),
      Address.fromString(token_id).toScVal(),
    ]);
    tx_builder.addOperation(new Contract(oracle_id).call('lastprice', asset));
    let result = await stellar_rpc.simulateTransaction(tx_builder.build());
    if (rpc.Api.isSimulationSuccess(result)) {
      const xdr_str = result.result?.retval.toXDR('base64');
      if (xdr_str) {
        let price_result = xdr.ScVal.fromXDR(xdr_str, 'base64')?.value();
        if (price_result) {
          // @ts-ignore
          const price = scValToBigInt(price_result[0]?.val());
          return Number(price) / 10 ** decimals;
        }
      }
    }
    console.error('unable to fetch oracle price for token:', token_id);
    return Number(1);
  } catch (e: any) {
    console.error('unable to fetch balance for token: ', token_id);
    return Number(1);
  }
}
