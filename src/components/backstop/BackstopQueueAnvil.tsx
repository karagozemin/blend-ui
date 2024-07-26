import {
  BackstopContract,
  parseResult,
  PoolBackstopActionArgs,
  Q4W,
} from '@blend-capital/blend-sdk';
import { Box, Typography, useTheme } from '@mui/material';
import { SorobanRpc } from '@stellar/stellar-sdk';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useSettings, ViewType } from '../../contexts';
import { TxStatus, TxType, useWallet } from '../../contexts/wallet';
import { RPC_DEBOUNCE_DELAY, useDebouncedState } from '../../hooks/debounce';
import { useStore } from '../../store/store';
import { toBalance } from '../../utils/formatter';
import { scaleInputToBigInt } from '../../utils/scval';
import { getErrorFromSim } from '../../utils/txSim';
import { AnvilAlert } from '../common/AnvilAlert';
import { InputBar } from '../common/InputBar';
import { InputButton } from '../common/InputButton';
import { OpaqueButton } from '../common/OpaqueButton';
import { PoolComponentProps } from '../common/PoolComponentProps';
import { Row } from '../common/Row';
import { Section, SectionSize } from '../common/Section';
import { TxOverview } from '../common/TxOverview';
import { Value } from '../common/Value';
import { ValueChange } from '../common/ValueChange';

export const BackstopQueueAnvil: React.FC<PoolComponentProps> = ({ poolId }) => {
  const theme = useTheme();
  const { viewType } = useSettings();

  const { connected, walletAddress, backstopQueueWithdrawal, txType, txStatus, isLoading } =
    useWallet();

  const backstop = useStore((state) => state.backstop);
  const backstopPoolData = useStore((state) => state.backstop?.pools?.get(poolId));
  const userBackstopData = useStore((state) => state.backstopUserData);
  const userPoolBackstopEst = userBackstopData?.estimates.get(poolId);
  const userBackstopBalacne = userBackstopData?.balances.get(poolId);
  const userShares = userBackstopBalacne?.shares ?? BigInt(0);
  const backstopTokenPrice = backstop?.backstopToken.lpTokenPrice ?? 1;
  const decimals = 7;
  const sharesToTokens =
    Number(backstopPoolData?.poolBalance.tokens) /
    Number(backstopPoolData?.poolBalance.shares) /
    1e7;

  const [toQueue, setToQueue] = useState<string>('');
  const [toQueueShares, setToQueueShares] = useState<BigInt>();
  const [simResponse, setSimResponse] = useState<SorobanRpc.Api.SimulateTransactionResponse>();
  const [parsedSimResult, setParsedSimResult] = useState<Q4W>();
  const [loadingEstimate, setLoadingEstimate] = useState<boolean>(false);
  const loading = isLoading || loadingEstimate;

  useDebouncedState(toQueue, RPC_DEBOUNCE_DELAY, txType, async () => {
    setSimResponse(undefined);
    setParsedSimResult(undefined);
    await handleSubmitTransaction(true);
    setLoadingEstimate(false);
  });

  if (txStatus === TxStatus.SUCCESS && txType === TxType.CONTRACT && Number(toQueue) != 0) {
    setToQueue('');
  }

  const { isError, isSubmitDisabled, isMaxDisabled, reason, disabledType, extraContent } = useMemo(
    () => getErrorFromSim(toQueue, decimals, loading, simResponse, undefined),
    [simResponse, toQueue, userBackstopData, loading]
  );

  const handleInputChange = (input: string) => {
    setToQueue(input);
    const tokensToShares =
      Number(backstopPoolData?.poolBalance.shares) /
      Number(backstopPoolData?.poolBalance.tokens) /
      1e7;
    const as_shares = Number(input) * tokensToShares;
    const as_bigint = BigInt(Math.floor(as_shares * 1e7));
    setToQueueShares(as_bigint); // -> this state change should be the one to trigger the simulation
  };

  const handleQueueMax = () => {
    if (userPoolBackstopEst && userPoolBackstopEst.tokens > 0) {
      setToQueue(userPoolBackstopEst.tokens.toFixed(7));
      setToQueueShares(userShares);
    }
  };
  const handleSubmitTransaction = async (sim: boolean) => {
    if (toQueueShares && connected) {
      let depositArgs: PoolBackstopActionArgs = {
        from: walletAddress,
        pool_address: poolId,
        amount: scaleInputToBigInt(toQueue, 7),
      };
      let response = await backstopQueueWithdrawal(depositArgs, sim);
      if (response) {
        setSimResponse(response);
        if (SorobanRpc.Api.isSimulationSuccess(response)) {
          setParsedSimResult(parseResult(response, BackstopContract.parsers.queueWithdrawal));
        }
      }
    }
  };

  return (
    <Row>
      <Section
        width={SectionSize.FULL}
        sx={{ padding: '0px', display: 'flex', flexDirection: 'column' }}
      >
        <Box
          sx={{
            background: theme.palette.backstop.opaque,
            width: '100%',
            borderRadius: '5px',
            padding: '12px',
            marginBottom: '12px',
            boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
          }}
        >
          <Typography variant="body2" sx={{ marginLeft: '12px', marginBottom: '12px' }}>
            Amount to queue for withdrawal
          </Typography>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              gap: '12px',
              flexDirection: viewType !== ViewType.MOBILE ? 'row' : 'column',
              marginBottom: '12px',
            }}
          >
            <InputBar
              symbol={'BLND-USDC LP'}
              value={toQueue}
              onValueChange={(v) => {
                handleInputChange(v);
                setLoadingEstimate(true);
              }}
              palette={theme.palette.backstop}
              sx={{ width: '100%', display: 'flex' }}
            >
              <InputButton
                palette={theme.palette.backstop}
                onClick={handleQueueMax}
                disabled={isMaxDisabled}
                text="MAX"
              />
            </InputBar>
            {viewType !== ViewType.MOBILE && (
              <OpaqueButton
                onClick={() => handleSubmitTransaction(false)}
                palette={theme.palette.backstop}
                sx={{ minWidth: '108px', padding: '6px', display: 'flex' }}
                disabled={isSubmitDisabled}
              >
                Queue
              </OpaqueButton>
            )}
          </Box>
          <Box sx={{ marginLeft: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Typography variant="h5" sx={{ color: theme.palette.text.secondary }}>
              {`$${toBalance(Number(toQueue ?? 0) * backstopTokenPrice)}`}
            </Typography>
            {viewType === ViewType.MOBILE && (
              <OpaqueButton
                onClick={() => handleSubmitTransaction(false)}
                palette={theme.palette.backstop}
                sx={{ minWidth: '108px', padding: '6px', display: 'flex', width: '100%' }}
                disabled={isSubmitDisabled}
              >
                Queue
              </OpaqueButton>
            )}
          </Box>
        </Box>
        {!isError && (
          <TxOverview>
            <>
              <Value title="Amount to queue" value={`${toQueue ?? '0'} BLND-USDC LP`} />
              <Value
                title={
                  <>
                    <Image src="/icons/dashboard/gascan.svg" alt="blend" width={20} height={20} />{' '}
                    Gas
                  </>
                }
                value={`${toBalance(
                  BigInt((simResponse as any)?.minResourceFee ?? 0),
                  decimals
                )} XLM`}
              />
              <Value
                title="New queue expiration"
                value={
                  (parsedSimResult
                    ? new Date(Number(parsedSimResult.exp) * 1000)
                    : new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)
                  )
                    .toISOString()
                    .split('T')[0]
                }
              />

              <ValueChange
                title="Your total amount queued"
                curValue={`${toBalance(userPoolBackstopEst?.totalQ4W)} BLND-USDC LP`}
                newValue={`${toBalance(
                  userPoolBackstopEst && parsedSimResult
                    ? userPoolBackstopEst.totalQ4W + Number(parsedSimResult.amount) * sharesToTokens
                    : 0
                )} BLND-USDC LP`}
              />
            </>
          </TxOverview>
        )}
        {isError && (
          <AnvilAlert severity={disabledType} message={reason} extraContent={extraContent} />
        )}
      </Section>
    </Row>
  );
};
