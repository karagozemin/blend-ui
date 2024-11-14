import { FixedMath } from '@blend-capital/blend-sdk';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Box, Link, Typography, useTheme } from '@mui/material';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { BorrowAnvil } from '../components/borrow/BorrowAnvil';
import { AprDisplay } from '../components/common/AprDisplay';
import { GoBackHeader } from '../components/common/GoBackHeader';
import { ReserveDetailsBar } from '../components/common/ReserveDetailsBar';
import { Row } from '../components/common/Row';
import { Section, SectionSize } from '../components/common/Section';
import { StackedText } from '../components/common/StackedText';
import { useBackstop, usePool, usePoolOracle } from '../hooks/api';
import { toBalance, toPercentage } from '../utils/formatter';
import { estimateEmissionsApr } from '../utils/math';
import { getTokenLinkFromReserve } from '../utils/token';

const Borrow: NextPage = () => {
  const theme = useTheme();

  const router = useRouter();
  const { poolId, assetId } = router.query;
  const safePoolId = typeof poolId == 'string' && /^[0-9A-Z]{56}$/.test(poolId) ? poolId : '';
  const safeAssetId = typeof assetId == 'string' && /^[0-9A-Z]{56}$/.test(assetId) ? assetId : '';

  const { data: pool } = usePool(safePoolId);
  const { data: poolOracle } = usePoolOracle(pool);
  const { data: backstop } = useBackstop();
  const reserve = pool?.reserves.get(safeAssetId);

  const maxUtilFloat = reserve ? FixedMath.toFloat(BigInt(reserve.config.max_util), 7) : 1;
  const totalSupplied = reserve ? reserve.totalSupplyFloat() : 0;
  const availableToBorrow = reserve
    ? totalSupplied * maxUtilFloat - reserve.totalLiabilitiesFloat()
    : 0;

  const oraclePrice = reserve ? poolOracle?.getPriceFloat(reserve.assetId) : 0;
  const emissionsPerAsset = reserve !== undefined ? reserve.emissionsPerYearPerBorrowedAsset() : 0;
  const emissionApr =
    backstop && emissionsPerAsset > 0 && oraclePrice
      ? estimateEmissionsApr(emissionsPerAsset, backstop.backstopToken, oraclePrice)
      : undefined;

  return (
    <>
      <Row>
        <GoBackHeader name={pool?.config.name} />
      </Row>
      <ReserveDetailsBar action="borrow" poolId={safePoolId} activeReserveId={safeAssetId} />
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
              <Typography variant="h4" sx={{ color: theme.palette.borrow.main }}>
                {toBalance(availableToBorrow, reserve?.config.decimals)}
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
        <Section
          width={SectionSize.THIRD}
          style={{ display: 'flex', justifyContent: 'space-between' }}
        >
          <StackedText
            title="Borrow APR"
            text={
              reserve ? (
                <AprDisplay
                  assetSymbol={reserve.tokenMetadata.symbol}
                  assetApr={reserve.borrowApr}
                  emissionSymbol={'BLND'}
                  emissionApr={emissionApr}
                  isSupply={false}
                  direction={'horizontal'}
                />
              ) : (
                ''
              )
            }
            sx={{ padding: '6px' }}
            tooltip="The interest rate charged for a borrowed position. This rate will fluctuate based on the market conditions and is accrued to the borrowed position."
          ></StackedText>
        </Section>
        <Section width={SectionSize.THIRD}>
          <StackedText
            title="Liability Factor"
            text={toPercentage(reserve?.getLiabilityFactor())}
            sx={{ width: '100%', padding: '6px' }}
            tooltip="The percent of this asset's value subtracted from your borrow capacity."
          ></StackedText>
        </Section>
        <Section width={SectionSize.THIRD}>
          <StackedText
            title="Total Borrowed"
            text={toBalance(reserve?.totalLiabilitiesFloat())}
            sx={{ width: '100%', padding: '6px' }}
          ></StackedText>
        </Section>
      </Row>
      <BorrowAnvil poolId={safePoolId} assetId={safeAssetId} />
    </>
  );
};

export default Borrow;
