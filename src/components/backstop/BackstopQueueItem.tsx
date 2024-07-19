import { PoolBackstopActionArgs, Q4W } from '@blend-capital/blend-sdk';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useSettings, ViewType } from '../../contexts';
import { useWallet } from '../../contexts/wallet';
import theme from '../../theme';
import { toBalance, toTimeSpan } from '../../utils/formatter';
import { OpaqueButton } from '../common/OpaqueButton';
import { PoolComponentProps } from '../common/PoolComponentProps';
import { Row } from '../common/Row';
import { TokenIcon } from '../common/TokenIcon';

export interface BackstopQueueItemProps extends PoolComponentProps {
  q4w: Q4W;
  inTokens: number;
}
export const BackstopQueueItem: React.FC<BackstopQueueItemProps> = ({ q4w, inTokens, poolId }) => {
  const { connected, walletAddress, backstopDequeueWithdrawal, backstopWithdraw } = useWallet();

  const { viewType } = useSettings();

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

  const handleClick = async (amount: bigint) => {
    if (connected) {
      let actionArgs: PoolBackstopActionArgs = {
        from: walletAddress,
        pool_address: poolId,
        amount: BigInt(amount),
      };
      if (timeLeft > 0) {
        await backstopDequeueWithdrawal(actionArgs, false);
      } else {
        await backstopWithdraw(actionArgs, false);
      }
    }
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
          <TokenIcon symbol="blndusdclp" sx={{ marginRight: '12px' }}></TokenIcon>
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
        {viewType === ViewType.REGULAR && (
          <OpaqueButton
            onClick={() => handleClick(q4w.amount)}
            palette={theme.palette.positive}
            sx={{ height: '35px', width: '108px', margin: '12px', padding: '6px' }}
          >
            {timeLeft > 0 ? 'Unqueue' : 'Withdraw'}
          </OpaqueButton>
        )}
      </Row>
      {viewType !== ViewType.REGULAR && (
        <Row>
          <OpaqueButton
            onClick={() => handleClick(q4w.amount)}
            palette={theme.palette.positive}
            sx={{ height: '35px', width: '100%', margin: '12px', padding: '6px' }}
          >
            {timeLeft > 0 ? 'Unqueue' : 'Withdraw'}
          </OpaqueButton>
        </Row>
      )}
    </>
  );
};
