import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Box, IconButton, Typography, useTheme } from '@mui/material';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { AssetGraphBoxBorrow } from '../components/asset/AssetGraphBoxBorrow';
import { AssetGraphBoxSupply } from '../components/asset/AssetGraphBoxSupply';
import { Divider } from '../components/common/Divider';
import { Row } from '../components/common/Row';
import { Section, SectionSize } from '../components/common/Section';
import { TokenHeader } from '../components/common/TokenHeader';
import { PoolExploreBar } from '../components/pool/PoolExploreBar';
import { useSettings, ViewType } from '../contexts';
import { usePool, usePoolOracle } from '../hooks/api';

const Asset: NextPage = () => {
  const router = useRouter();
  const theme = useTheme();
  const { viewType } = useSettings();
  const { showLend, setShowLend } = useSettings();

  const { poolId } = router.query;
  const safePoolId = typeof poolId == 'string' && /^[0-9A-Z]{56}$/.test(poolId) ? poolId : '';

  const { data: pool } = usePool(safePoolId);
  const { data: poolOracle, isError: isOracleError } = usePoolOracle(pool);

  const title = 'USDC';

  return (
    <>
      <PoolExploreBar poolId={safePoolId} />
      <Row sx={{ margin: '12px', justifyContent: 'flex-start', alignItems: 'center' }}>
        <TokenHeader reserve={'reserve'} sx={{ marginRight: '12px' }} />
        <IconButton
          onClick={() => window.open(``, '_blank')}
          size="small"
          sx={{
            marginLeft: '6px',
            color: theme.palette.text.secondary,
          }}
        >
          <OpenInNewIcon fontSize="inherit" />
        </IconButton>
      </Row>
      <Divider />
      <Row
        sx={{ display: 'flex', flexDirection: viewType !== ViewType.REGULAR ? 'column' : 'row' }}
      >
        <AssetGraphBoxSupply poolId={''} />
        <AssetGraphBoxBorrow poolId={''} />
      </Row>
      <Row sx={{ marginBottom: '48px' }}>
        <Section width={SectionSize.FULL} sx={{ dislay: 'flex', flexDirection: 'column' }}>
          <Row sx={{ width: '100%' }}>
            <Box
              sx={{
                width: '100%',
                padding: '6px',
                margin: '6px',
                borderRadius: '5px',
                display: 'flex',
                justifyContent: 'space-between',
                background: theme.palette.background.default,
              }}
            >
              <Typography sx={{ padding: '6px' }}>Utilization</Typography>
              <Typography variant="h4" sx={{ padding: '6px' }}>
                26.66%
              </Typography>
            </Box>
          </Row>
          <Row sx={{ width: '100%' }}>
            <Box
              sx={{
                width: '100%',
                padding: '6px',
                margin: '6px',
                borderRadius: '5px',
                display: 'flex',
                justifyContent: 'space-between',
                background: theme.palette.background.default,
              }}
            >
              <Typography sx={{ padding: '6px' }}> Target Utilization</Typography>
              <Typography variant="h4" sx={{ padding: '6px' }}>
                30.00%
              </Typography>
            </Box>
          </Row>
          <Row sx={{ width: '100%' }}>
            <Box
              sx={{
                width: '100%',
                padding: '6px',
                margin: '6px',
                borderRadius: '5px',
                display: 'flex',
                justifyContent: 'space-between',
                background: theme.palette.background.default,
              }}
            >
              <Typography sx={{ padding: '6px' }}>Max Utilization</Typography>
              <Typography variant="h4" sx={{ padding: '6px' }}>
                60.00%
              </Typography>
            </Box>
          </Row>
        </Section>
      </Row>
    </>
  );
};

export default Asset;
