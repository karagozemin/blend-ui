import { BackstopPoolEst, BackstopPoolUserEst } from '@blend-capital/blend-sdk';
import { Box, Typography, useTheme } from '@mui/material';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { BackstopAPR } from '../components/backstop/BackstopAPR';
import { BackstopDepositAnvil } from '../components/backstop/BackstopDepositAnvil';
import { BackstopDropdown } from '../components/backstop/BackstopDropdown';
import { GoBackHeader } from '../components/common/GoBackHeader';
import { Row } from '../components/common/Row';
import { Section, SectionSize } from '../components/common/Section';
import { StackedText } from '../components/common/StackedText';
import {
  useBackstop,
  useBackstopPool,
  useBackstopPoolUser,
  useHorizonAccount,
  usePool,
  useTokenBalance,
} from '../hooks/api';
import { toBalance, toPercentage } from '../utils/formatter';

const BackstopDeposit: NextPage = () => {
  const theme = useTheme();

  const router = useRouter();
  const { poolId } = router.query;
  const safePoolId = typeof poolId == 'string' && /^[0-9A-Z]{56}$/.test(poolId) ? poolId : '';

  const { data: pool } = usePool(safePoolId);
  const { data: backstop } = useBackstop();
  const { data: backstopPoolData } = useBackstopPool(safePoolId);
  const { data: userBackstopPoolData } = useBackstopPoolUser(safePoolId);
  const { data: horizonAccount } = useHorizonAccount();
  const { data: lpBalance } = useTokenBalance(
    backstop?.backstopToken?.id ?? '',
    undefined,
    horizonAccount
  );

  const backstopPoolEst =
    backstop !== undefined && backstopPoolData !== undefined
      ? BackstopPoolEst.build(backstop.backstopToken, backstopPoolData.poolBalance)
      : undefined;

  const backstopUserEst =
    userBackstopPoolData !== undefined && backstop !== undefined && backstopPoolData !== undefined
      ? BackstopPoolUserEst.build(backstop, backstopPoolData, userBackstopPoolData)
      : undefined;

  return (
    <>
      <Row>
        <GoBackHeader name={pool?.config?.name} />
      </Row>
      <Row>
        <Section width={SectionSize.FULL} sx={{ marginTop: '12px', marginBottom: '12px' }}>
          <BackstopDropdown type="deposit" poolId={safePoolId} />
        </Section>
      </Row>
      <Row>
        <Section width={SectionSize.FULL} sx={{ padding: '12px' }}>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'row' }}>
              <Typography variant="h5" sx={{ marginRight: '6px' }}>
                Available
              </Typography>
              <Typography variant="h4" sx={{ color: theme.palette.backstop.main }}>
                {toBalance(lpBalance, 7)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="h5" sx={{ color: theme.palette.text.secondary }}>
                BLND-USDC LP
              </Typography>
            </Box>
          </Box>
        </Section>
      </Row>
      <Row>
        <Section width={SectionSize.THIRD} sx={{ alignItems: 'center' }}>
          <BackstopAPR poolId={safePoolId} />
        </Section>
        <Section width={SectionSize.THIRD}>
          <StackedText
            title="Q4W"
            text={toPercentage(backstopPoolEst?.q4wPercentage)}
            sx={{ width: '100%', padding: '6px' }}
            tooltip="Percent of capital insuring this pool queued for withdrawal (Q4W). A higher percent indicates potential risks."
          ></StackedText>
        </Section>
        <Section width={SectionSize.THIRD}>
          <StackedText
            title="Total deposited"
            text={`$${toBalance(backstopPoolEst?.totalSpotValue)}`}
            sx={{ width: '100%', padding: '6px' }}
          ></StackedText>
        </Section>
      </Row>
      <BackstopDepositAnvil poolId={safePoolId} />
    </>
  );
};

export default BackstopDeposit;
