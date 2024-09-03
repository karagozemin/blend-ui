import { FixedMath } from '@blend-capital/blend-sdk';
import { Box, Typography, useTheme } from '@mui/material';
import { useBackstop, useBackstopPool, useBackstopPoolUser } from '../../hooks/api';
import { PoolComponentProps } from '../common/PoolComponentProps';
import { Row } from '../common/Row';
import { Section, SectionSize } from '../common/Section';
import { BackstopQueueItem } from './BackstopQueueItem';

export const BackstopQueueMod: React.FC<PoolComponentProps> = ({ poolId }) => {
  const theme = useTheme();

  const { data: backstop } = useBackstop();
  const { data: backstopPoolData } = useBackstopPool(poolId);
  const { data: backstopUserData } = useBackstopPoolUser(poolId);

  if (
    backstop === undefined ||
    backstopUserData === undefined ||
    backstopPoolData === undefined ||
    (backstopUserData.balance.totalQ4W == BigInt(0) &&
      backstopUserData.balance.unlockedQ4W == BigInt(0))
  ) {
    return <></>;
  }

  const sharesToTokens =
    Number(backstopPoolData.poolBalance.tokens) / Number(backstopPoolData.poolBalance.shares);

  return (
    <Row>
      <Section width={SectionSize.FULL} sx={{ display: 'flex', flexDirection: 'column' }}>
        <Row>
          <Box
            sx={{
              margin: '6px',
              padding: '6px',
              width: '100%',
              alignItems: 'center',
              backgroundColor: theme.palette.background.default,
              borderRadius: '5px',
            }}
          >
            <Typography sx={{ padding: '6px' }}>Queued for withdrawal (Q4W)</Typography>
          </Box>
        </Row>
        {backstopUserData.balance.unlockedQ4W != BigInt(0) && (
          <BackstopQueueItem
            key={0}
            poolId={poolId}
            q4w={{ exp: BigInt(0), amount: backstopUserData.balance.unlockedQ4W }}
            inTokens={FixedMath.toFloat(backstopUserData.balance.unlockedQ4W) * sharesToTokens}
            first={true}
          />
        )}
        {backstopUserData.balance.q4w
          .sort((a, b) => Number(a.exp) - Number(b.exp))
          .map((q4w, index) => (
            <BackstopQueueItem
              key={Number(q4w.exp)}
              poolId={poolId}
              q4w={q4w}
              inTokens={FixedMath.toFloat(q4w.amount) * sharesToTokens}
              first={backstopUserData.balance.unlockedQ4W == BigInt(0) && index == 0}
            />
          ))}
      </Section>
    </Row>
  );
};
