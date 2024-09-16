import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Box, Link, Typography, useTheme } from '@mui/material';

import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { FlameIcon } from '../components/common/FlameIcon';
import { GoBackHeader } from '../components/common/GoBackHeader';
import { ReserveDropdown } from '../components/common/ReserveDropdown';
import { Row } from '../components/common/Row';
import { Section, SectionSize } from '../components/common/Section';
import { StackedText } from '../components/common/StackedText';
import { LendAnvil } from '../components/lend/LendAnvil';
import { useHorizonAccount, usePool, useTokenBalance } from '../hooks/api';
import { getEmissionTextFromValue, toBalance, toPercentage } from '../utils/formatter';
import { getTokenLinkFromReserve } from '../utils/token';

const Supply: NextPage = () => {
  const theme = useTheme();

  const router = useRouter();
  const { poolId, assetId } = router.query;
  const safePoolId = typeof poolId == 'string' && /^[0-9A-Z]{56}$/.test(poolId) ? poolId : '';
  const safeAssetId = typeof assetId == 'string' && /^[0-9A-Z]{56}$/.test(assetId) ? assetId : '';

  const { data: pool } = usePool(safePoolId);
  const reserve = pool?.reserves.get(safeAssetId);
  const { data: horizonAccount } = useHorizonAccount();
  const { data: tokenBalance } = useTokenBalance(
    reserve?.assetId,
    reserve?.tokenMetadata?.asset,
    horizonAccount,
    reserve !== undefined
  );

  const emissionsPerAsset = reserve !== undefined ? reserve.emissionsPerYearPerSuppliedAsset() : 0;
  return (
    <>
      <Row>
        <GoBackHeader name={pool?.config.name} />
      </Row>
      <Row>
        <Section width={SectionSize.FULL} sx={{ marginTop: '12px', marginBottom: '12px' }}>
          <ReserveDropdown action="supply" poolId={safePoolId} activeReserveId={safeAssetId} />
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
                Balance
              </Typography>
              <Typography variant="h4" sx={{ color: theme.palette.lend.main }}>
                {toBalance(tokenBalance, reserve?.config.decimals)}
              </Typography>
            </Box>
            <Box>
              <Link
                target="_blank"
                href={getTokenLinkFromReserve(reserve)}
                variant="h5"
                rel="noopener"
                sx={{
                  color: theme.palette.text.secondary,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  borderBottom: '.5px solid transparent',
                  '&:hover': {
                    borderBottom: `.5px solid ${theme.palette.text.secondary}`,
                  },
                }}
              >
                <Typography variant="h5" sx={{ color: theme.palette.text.secondary }}>
                  {reserve?.tokenMetadata?.symbol ?? ''}
                </Typography>
                <OpenInNewIcon fontSize="inherit" />
              </Link>
            </Box>
          </Box>
        </Section>
      </Row>
      <Row>
        <Section width={SectionSize.THIRD}>
          <StackedText
            title="Supply APR"
            text={
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {toPercentage(reserve?.supplyApr)}{' '}
                {emissionsPerAsset > 0 && (
                  <FlameIcon
                    width={22}
                    height={22}
                    title={getEmissionTextFromValue(
                      emissionsPerAsset,
                      reserve?.tokenMetadata?.symbol || 'token'
                    )}
                  />
                )}
              </div>
            }
            sx={{ width: '100%', padding: '6px' }}
          ></StackedText>
        </Section>
        <Section width={SectionSize.THIRD}>
          <StackedText
            title="Collateral factor"
            text={toPercentage(reserve?.getCollateralFactor())}
            sx={{ width: '100%', padding: '6px' }}
          ></StackedText>
        </Section>
        <Section width={SectionSize.THIRD}>
          <StackedText
            title="Total supplied"
            text={toBalance(reserve?.totalSupplyFloat())}
            sx={{ width: '100%', padding: '6px' }}
          ></StackedText>
        </Section>
      </Row>
      <LendAnvil poolId={safePoolId} assetId={safeAssetId} />
    </>
  );
};

export default Supply;
