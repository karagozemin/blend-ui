import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Box, Button, Typography, useTheme } from '@mui/material';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { AssetBorrowInfo } from '../components/asset/AssetBorrowInfo';
import { AssetSupplyInfo } from '../components/asset/AssetSupplyInfo';
import { InterestGraph } from '../components/asset/InterestGraph';
import { AllbridgeButton } from '../components/bridge/allbridge';
import { Divider } from '../components/common/Divider';
import { ReserveExploreBar } from '../components/common/ReserveExplorerBar';
import { Row } from '../components/common/Row';
import { Section, SectionSize } from '../components/common/Section';
import { Skeleton } from '../components/common/Skeleton';
import { StackedTextBox } from '../components/common/StackedTextBox';
import { NotPoolBar } from '../components/pool/NotPoolBar';
import { PoolMenu } from '../components/pool/PoolMenu';
import { useSettings, ViewType } from '../contexts';
import { usePool, usePoolMeta, usePoolOracle, useTokenMetadata } from '../hooks/api';
import { NOT_BLEND_POOL_ERROR_MESSAGE } from '../hooks/types';
import { toCompactAddress, toPercentage } from '../utils/formatter';

const Asset: NextPage = () => {
  const router = useRouter();
  const theme = useTheme();
  const { viewType } = useSettings();

  const { poolId, assetId } = router.query;
  const safePoolId = typeof poolId == 'string' && /^[0-9A-Z]{56}$/.test(poolId) ? poolId : '';

  const { data: poolMeta, error: poolError } = usePoolMeta(safePoolId);
  const { data: pool } = usePool(poolMeta);
  const { data: poolOracle } = usePoolOracle(pool);
  let safeAssetId = '';
  if (assetId === undefined) {
    safeAssetId = pool ? Array.from(pool.reserves.keys())[0] : '';
  } else if (typeof assetId == 'string' && /^[0-9A-Z]{56}$/.test(assetId)) {
    safeAssetId = assetId;
  }
  const { data: tokenMetadata } = useTokenMetadata(safeAssetId);
  const symbol = tokenMetadata?.symbol ?? toCompactAddress(safeAssetId);

  const reserve = pool?.reserves.get(safeAssetId);
  const hasData = pool && poolOracle && reserve;

  if (poolError?.message === NOT_BLEND_POOL_ERROR_MESSAGE) {
    return <NotPoolBar poolId={safePoolId} />;
  }

  return (
    <>
      <Row>
        <Section width={SectionSize.FULL} sx={{ marginTop: '12px' }}>
          <PoolMenu poolId={safePoolId} />
        </Section>
      </Row>
      <ReserveExploreBar poolId={safePoolId} assetId={safeAssetId} />
      {symbol === 'USDC' && <AllbridgeButton />}
      {hasData ? (
        <>
          <Divider />
          <Section
            width={SectionSize.FULL}
            sx={{
              display: 'flex',
              flexDirection: 'row',
              marginBottom: '12px',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: theme.palette.background.paper,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-start',
              }}
            >
              <Typography sx={{ padding: '6px' }}>Oracle Price</Typography>
              <Button
                sx={{
                  alignItems: 'center',
                  padding: 0,
                  cursor: 'pointer',
                  minWidth: '0px',
                  color: theme.palette.text.primary,
                }}
                onClick={() =>
                  window.open(
                    `${process.env.NEXT_PUBLIC_STELLAR_EXPERT_URL}/contract/${pool.metadata.oracle}`,
                    '_blank'
                  )
                }
              >
                <OpenInNewIcon fontSize="inherit" />
              </Button>
            </Box>

            <Typography sx={{ padding: '6px' }}>
              {`$${poolOracle.getPriceFloat(reserve.assetId)?.toFixed(2) ?? ''}`}
            </Typography>
          </Section>
          <Section width={SectionSize.FULL} sx={{ padding: '6px', display: 'flex' }}>
            <Row
              sx={{
                padding: '6px',
                margin: '6px',
                borderRadius: '5px',
                background: theme.palette.background.default,
                alignItems: 'center',
              }}
            >
              <Typography sx={{ padding: '6px' }}>Reserve Index</Typography>
              <Typography sx={{ padding: '6px' }}>{reserve.config.index}</Typography>
            </Row>
            <Row
              sx={{
                padding: '6px',
                margin: '6px',
                borderRadius: '5px',
                background: theme.palette.background.default,
                alignItems: 'center',
              }}
            >
              <Typography sx={{ padding: '6px' }}>Supply Emission Index</Typography>
              <Typography sx={{ padding: '6px' }}>{reserve.getBTokenEmissionIndex()}</Typography>
            </Row>
            <Row
              sx={{
                padding: '6px',
                margin: '6px',
                borderRadius: '5px',
                background: theme.palette.background.default,
                alignItems: 'center',
              }}
            >
              <Typography sx={{ padding: '6px' }}>Borrow Emission Index</Typography>
              <Typography sx={{ padding: '6px' }}>{reserve.getDTokenEmissionIndex()}</Typography>
            </Row>
          </Section>
          <Row
            sx={{
              display: 'flex',
              flexDirection: viewType !== ViewType.REGULAR ? 'column' : 'row',
            }}
          >
            <AssetSupplyInfo poolId={safePoolId} assetId={safeAssetId} />
            <AssetBorrowInfo poolId={safePoolId} assetId={safeAssetId} />
          </Row>

          <Section
            width={SectionSize.FULL}
            sx={{
              dislay: 'flex',
              flexDirection: 'column',
              marginBottom: '48px',
              display: 'flex',
              background: theme.palette.background.paper,
            }}
          >
            <Row sx={{ margin: '4px 4px 4px 6px', paddingLeft: '6px' }}>
              <Typography variant="h3" sx={{ color: theme.palette.text.primary }}>
                Interest Rate Model
              </Typography>
            </Row>
            <Row>
              <InterestGraph poolId={safePoolId} assetId={safeAssetId} reserve={reserve} />
            </Row>

            <Row>
              <StackedTextBox
                name={'Utilization'}
                text={toPercentage(reserve.getUtilizationFloat())}
                sx={{
                  width: '100%',
                  padding: '6px',
                  border: '1px solid #2775C9',
                }}
              />
              <StackedTextBox
                name={'Target Utilization'}
                text={toPercentage(reserve.config.util / 1e7)}
                sx={{ width: '100%', padding: '6px' }}
              />
              <StackedTextBox
                name={'Max Utilization'}
                text={toPercentage(reserve.config.max_util / 1e7)}
                sx={{ width: '100%', padding: '6px' }}
              />
            </Row>
          </Section>
        </>
      ) : (
        <Skeleton />
      )}
    </>
  );
};

export default Asset;
