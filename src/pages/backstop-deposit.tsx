import { HelpOutline } from '@mui/icons-material';
import { Box, Tooltip, Typography, useTheme } from '@mui/material';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { BackstopAPR } from '../components/backstop/BackstopAPR';
import { BackstopDepositAnvil } from '../components/backstop/BackstopDepositAnvil';
import { BackstopDropdown } from '../components/backstop/BackstopDropdown';
import { GoBackHeader } from '../components/common/GoBackHeader';
import { Row } from '../components/common/Row';
import { Section, SectionSize } from '../components/common/Section';
import { StackedText } from '../components/common/StackedText';
import { useStore } from '../store/store';
import { toBalance, toPercentage } from '../utils/formatter';

const BackstopDeposit: NextPage = () => {
  const theme = useTheme();

  const router = useRouter();
  const { poolId } = router.query;
  const safePoolId = typeof poolId == 'string' && /^[0-9A-Z]{56}$/.test(poolId) ? poolId : '';

  const backstopPoolData = useStore((state) => state.backstop?.pools?.get(safePoolId));
  const poolData = useStore((state) => state.pools.get(safePoolId));
  const userBackstopData = useStore((state) => state.backstopUserData);

  return (
    <>
      <Row>
        <GoBackHeader name={poolData?.config.name} />
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
                {toBalance(userBackstopData?.tokens, 7)}
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
          <Tooltip
            title="Percent of capital insuring this pool queued for withdrawal (Q4W). A higher percent indicates potential risks."
            placement="top"
            enterTouchDelay={0}
            enterDelay={500}
            leaveTouchDelay={3000}
          >
            <Box sx={{ display: 'flex', flexDirection: 'row' }}>
              <StackedText
                title="Q4W"
                text={toPercentage(backstopPoolData?.estimates?.q4wPercentage)}
                sx={{ width: '100%', padding: '6px' }}
              ></StackedText>
              <HelpOutline
                sx={{
                  marginLeft: '-10px',
                  marginTop: '9px',
                  width: '15px',
                  color: 'text.secondary',
                }}
              />
            </Box>
          </Tooltip>
        </Section>
        <Section width={SectionSize.THIRD}>
          <StackedText
            title="Total deposited"
            text={`$${toBalance(backstopPoolData?.estimates?.totalSpotValue)}`}
            sx={{ width: '100%', padding: '6px' }}
          ></StackedText>
        </Section>
      </Row>
      <BackstopDepositAnvil poolId={safePoolId} />
    </>
  );
};

export default BackstopDeposit;
