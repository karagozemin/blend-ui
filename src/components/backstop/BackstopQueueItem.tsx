import { BackstopContract, PoolBackstopActionArgs, Q4W } from '@blend-capital/blend-sdk';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { Box, CircularProgress, SxProps, Theme, Tooltip, Typography } from '@mui/material';
import { SorobanRpc } from '@stellar/stellar-sdk';
import { useEffect, useState } from 'react';
import { useSettings, ViewType } from '../../contexts';
import { useWallet } from '../../contexts/wallet';
import { useSimulateOperation } from '../../hooks/api';
import theme from '../../theme';
import { toBalance, toTimeSpan } from '../../utils/formatter';
import { Icon } from '../common/Icon';
import { OpaqueButton } from '../common/OpaqueButton';
import { PoolComponentProps } from '../common/PoolComponentProps';
import { Row } from '../common/Row';

export interface BackstopQueueItemProps extends PoolComponentProps {
  q4w: Q4W;
  inTokens: number;
  first: boolean;
}
export const BackstopQueueItem: React.FC<BackstopQueueItemProps> = ({
  q4w,
  inTokens,
  first,
  poolId,
}) => {
  const { connected, walletAddress, backstopDequeueWithdrawal, backstopWithdraw, restore } =
    useWallet();
  const { viewType } = useSettings();

  const backstop = new BackstopContract(process.env.NEXT_PUBLIC_BACKSTOP ?? '');
  const actionArgs: PoolBackstopActionArgs = {
    from: walletAddress,
    pool_address: poolId,
    amount: q4w.amount,
  };
  // the BackstopQueueMod sets the expiration for unlocked withdrawals to 0
  const sim_op =
    q4w.exp === BigInt(0) ? backstop.dequeueWithdrawal(actionArgs) : backstop.withdraw(actionArgs);
  const { data: simResult, isLoading } = useSimulateOperation(
    sim_op,
    q4w.exp === BigInt(0) || first
  );
  const isRestore =
    isLoading === false && simResult !== undefined && SorobanRpc.Api.isSimulationRestore(simResult);

  const TOTAL_QUEUE_TIME_SECONDS = 21 * 24 * 60 * 60;

  const [timeLeft, setTimeLeft] = useState<number>(
    Math.max(0, Number(q4w.exp) - Math.floor(Date.now() / 1000))
  );
  const timeWaitedPercentage = Math.min(1, 1 - timeLeft / TOTAL_QUEUE_TIME_SECONDS);

  useEffect(() => {
    const timeInterval =
      Number(q4w.exp) - Math.floor(Date.now() / 1000) > 24 * 60 * 60 ? 60 * 1000 : 1000;
    const refreshInterval = setInterval(() => {
      setTimeLeft(Math.max(0, Number(q4w.exp) - Math.floor(Date.now() / 1000)));
    }, timeInterval);
    return () => clearInterval(refreshInterval);
  }, [q4w]);

  const handleClick = async () => {
    if (connected) {
      if (timeLeft > 0) {
        await backstopDequeueWithdrawal(actionArgs, false);
      } else {
        await backstopWithdraw(actionArgs, false);
      }
    }
  };

  const handleRestore = async () => {
    if (simResult && SorobanRpc.Api.isSimulationRestore(simResult)) {
      restore(simResult);
    }
  };

  const queueItemActionButton = (sx: SxProps<Theme>) => {
    const needsTooltip = !first || isRestore;
    const tooltipMessage = !first
      ? 'You can only unqueue the oldest withdrawal'
      : 'This transaction ran into expired entries that need to be restored before proceeding.';

    return needsTooltip ? (
      <Tooltip
        title={tooltipMessage}
        placement="top"
        enterTouchDelay={0}
        enterDelay={500}
        leaveTouchDelay={3000}
      >
        {isRestore ? (
          <OpaqueButton
            onClick={() => handleRestore()}
            palette={theme.palette.warning}
            disabled={false}
            sx={sx}
          >
            Restore
          </OpaqueButton>
        ) : (
          <OpaqueButton
            onClick={() => handleClick()}
            palette={theme.palette.positive}
            disabled={!first}
            sx={sx}
          >
            {timeLeft > 0 ? 'Unqueue' : 'Withdraw'}
          </OpaqueButton>
        )}
      </Tooltip>
    ) : (
      <OpaqueButton
        onClick={() => handleClick()}
        palette={theme.palette.positive}
        disabled={!first}
        sx={sx}
      >
        {timeLeft > 0 ? 'Unqueue' : 'Withdraw'}
      </OpaqueButton>
    );
  };

  return (
    <>
      <Row>
        <Box sx={{ margin: '6px', padding: '6px', display: 'flex', alignItems: 'center' }}>
          {timeLeft > 0 ? (
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '50px',
              }}
            >
              <CircularProgress
                sx={{
                  color: theme.palette.positive.main,
                  marginLeft: '6px',
                  marginRight: '12px',
                  position: 'absolte',
                }}
                size="30px"
                thickness={4.5}
                variant="determinate"
                value={timeWaitedPercentage * 100}
              />
              <CircularProgress
                sx={{
                  color: theme.palette.positive.opaque,
                  marginLeft: '6px',
                  marginRight: '12px',
                  position: 'absolute',
                }}
                size="30px"
                thickness={4.5}
                variant="determinate"
                value={100}
              />
            </Box>
          ) : (
            <CheckCircleOutlineIcon
              sx={{ color: theme.palette.primary.main, marginRight: '12px', fontSize: '35px' }}
            />
          )}
          <Icon
            src={`/icons/tokens/blndusdclp.svg`}
            alt={`blndusdclp`}
            sx={{ height: '30px', width: '30px', marginRight: '12px' }}
          />
          <Box>
            <Box sx={{ display: 'flex', flexDirection: 'row' }}>
              <Typography variant="h4" sx={{ marginRight: '6px' }}>
                {toBalance(inTokens)}
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                BLND-USDC LP
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ marginRight: '6px' }}>
              {timeLeft > 0 ? toTimeSpan(timeLeft) : 'Unlocked'}
            </Typography>
          </Box>
        </Box>
        {viewType === ViewType.REGULAR &&
          queueItemActionButton({ height: '35px', width: '108px', margin: '12px', padding: '6px' })}
      </Row>
      {viewType !== ViewType.REGULAR && (
        <Row>
          {queueItemActionButton({ height: '35px', width: '100%', margin: '12px', padding: '6px' })}
        </Row>
      )}
    </>
  );
};
