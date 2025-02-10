import { Box, Typography, useTheme } from '@mui/material';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { AprDisplay } from '../components/common/AprDisplay';
import { GoBackHeader } from '../components/common/GoBackHeader';
import { ReserveDetailsBar } from '../components/common/ReserveDetailsBar';
import { Row } from '../components/common/Row';
import { Section, SectionSize } from '../components/common/Section';
import { StackedText } from '../components/common/StackedText';
import { RepayAnvil } from '../components/repay/RepayAnvil';
import {
  useBackstop,
  useHorizonAccount,
  usePool,
  usePoolOracle,
  usePoolUser,
  useTokenBalance,
  useTokenMetadata,
} from '../hooks/api';
import { toBalance, toCompactAddress, toPercentage } from '../utils/formatter';
import { estimateEmissionsApr } from '../utils/math';

const Repay: NextPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const { poolId, assetId } = router.query;
  const safePoolId = typeof poolId == 'string' && /^[0-9A-Z]{56}$/.test(poolId) ? poolId : '';
  const safeAssetId = typeof assetId == 'string' && /^[0-9A-Z]{56}$/.test(assetId) ? assetId : '';

  const { data: pool } = usePool(safePoolId);
  const { data: poolUser } = usePoolUser(pool);
  const { data: tokenMetadata } = useTokenMetadata(safeAssetId);
  const reserve = pool?.reserves.get(safeAssetId);
  const symbol = tokenMetadata?.symbol ?? toCompactAddress(safeAssetId);
  const { data: horizonAccount } = useHorizonAccount();
  const { data: tokenBalance } = useTokenBalance(
    reserve?.assetId,
    tokenMetadata?.asset,
    horizonAccount,
    reserve !== undefined
  );
  const { data: poolOracle } = usePoolOracle(pool);
  const { data: backstop } = useBackstop();

  const emissionsPerAsset = reserve !== undefined ? reserve.emissionsPerYearPerBorrowedAsset() : 0;
  const oraclePrice = reserve ? poolOracle?.getPriceFloat(reserve.assetId) : 0;
  const emissionApr =
    backstop && emissionsPerAsset > 0 && oraclePrice
      ? estimateEmissionsApr(emissionsPerAsset, backstop.backstopToken, oraclePrice)
      : undefined;

  const currentDebt = reserve && poolUser ? poolUser.getLiabilitiesFloat(reserve) : undefined;

  return (
    <>
      <Row>
        <GoBackHeader poolId={safePoolId} />
      </Row>
      <ReserveDetailsBar action="repay" poolId={safePoolId} activeReserveId={safeAssetId} />
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
                Debt
              </Typography>
              <Typography variant="h4" sx={{ color: theme.palette.borrow.main }}>
                {toBalance(currentDebt)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="h5" sx={{ color: theme.palette.text.secondary }}>
                {symbol}
              </Typography>
            </Box>
          </Box>
        </Section>
      </Row>
      <Row>
        <Section width={SectionSize.THIRD}>
          <StackedText
            title="Borrow APR"
            text={
              reserve ? (
                <AprDisplay
                  assetSymbol={symbol}
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
            sx={{ width: '100%', padding: '6px' }}
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
            title="Wallet Balance"
            text={toBalance(tokenBalance, reserve?.config.decimals)}
            sx={{ width: '100%', padding: '6px' }}
          ></StackedText>
        </Section>
      </Row>
      <Row>
        <RepayAnvil poolId={safePoolId} assetId={safeAssetId} />
      </Row>
    </>
  );
};

export default Repay;
