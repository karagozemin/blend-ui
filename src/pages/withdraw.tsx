import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Box, Typography, useTheme } from '@mui/material';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { AprDisplay } from '../components/common/AprDisplay';
import { CustomButton } from '../components/common/CustomButton';
import { GoBackHeader } from '../components/common/GoBackHeader';
import { LinkBox } from '../components/common/LinkBox';
import { ReserveDropdown } from '../components/common/ReserveDropdown';
import { Row } from '../components/common/Row';
import { Section, SectionSize } from '../components/common/Section';
import { StackedText } from '../components/common/StackedText';
import { WithdrawAnvil } from '../components/withdraw/WithdrawAnvil';
import { useBackstop, usePool, usePoolOracle, usePoolUser } from '../hooks/api';
import { toBalance, toPercentage } from '../utils/formatter';
import { estimateEmissionsApr } from '../utils/math';

const Withdraw: NextPage = () => {
  const theme = useTheme();

  const router = useRouter();
  const { poolId, assetId } = router.query;
  const safePoolId = typeof poolId == 'string' && /^[0-9A-Z]{56}$/.test(poolId) ? poolId : '';
  const safeAssetId = typeof assetId == 'string' && /^[0-9A-Z]{56}$/.test(assetId) ? assetId : '';

  const { data: pool } = usePool(safePoolId);
  const { data: poolUser } = usePoolUser(pool);
  const { data: poolOracle } = usePoolOracle(pool);
  const { data: backstop } = useBackstop();
  const reserve = pool?.reserves.get(safeAssetId);

  const currentDeposit = reserve && poolUser ? poolUser.getCollateralFloat(reserve) : undefined;
  const emissionsPerAsset = reserve !== undefined ? reserve.emissionsPerYearPerSuppliedAsset() : 0;
  const oraclePrice = reserve ? poolOracle?.getPriceFloat(reserve.assetId) : 0;
  const emissionApr =
    backstop && emissionsPerAsset > 0 && oraclePrice
      ? estimateEmissionsApr(emissionsPerAsset, backstop.backstopToken, oraclePrice)
      : undefined;
  return (
    <>
      <Row>
        <GoBackHeader name={pool?.config.name} />
      </Row>
      <Row>
        <Section width={SectionSize.FULL} sx={{ marginTop: '12px', marginBottom: '12px' }}>
          <ReserveDropdown action="withdraw" poolId={safePoolId} activeReserveId={safeAssetId} />
        </Section>
      </Row>
      <Row>
        <Section width={SectionSize.FULL}>
          <LinkBox
            sx={{ width: '100%' }}
            to={{ pathname: '/asset', query: { poolId: poolId, assetId: safeAssetId } }}
          >
            <CustomButton
              sx={{
                width: '100%',
                alignItems: 'space-between',
                paddingLeft: '12px',
                paddingRight: '12px',
                '&:hover': { backgroundColor: theme.palette.background.default },
              }}
            >
              <Typography variant="body1">Asset Info</Typography>
              <ArrowForwardIcon fontSize="inherit" sx={{ color: theme.palette.text.secondary }} />
            </CustomButton>
          </LinkBox>
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
              <Typography variant="h4" sx={{ color: theme.palette.lend.main }}>
                {toBalance(currentDeposit)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="h5" sx={{ color: theme.palette.text.secondary }}>
                {reserve?.tokenMetadata?.symbol ?? ''}
              </Typography>
            </Box>
          </Box>
        </Section>
      </Row>
      <Row>
        <Section width={SectionSize.THIRD}>
          <StackedText
            title="Supply APR"
            text={
              reserve ? (
                <AprDisplay
                  assetSymbol={reserve.tokenMetadata.symbol}
                  assetApr={reserve.supplyApr}
                  emissionSymbol={'BLND'}
                  emissionApr={emissionApr}
                  isSupply={true}
                  direction={'horizontal'}
                />
              ) : (
                ''
              )
            }
            sx={{ width: '100%', padding: '6px' }}
            tooltip="The interest rate earned on a supplied position. This rate will fluctuate based on the market conditions and is accrued to the supplied position."
          ></StackedText>
        </Section>
        <Section width={SectionSize.THIRD}>
          <StackedText
            title="Collateral Factor"
            text={toPercentage(reserve?.getCollateralFactor())}
            sx={{ width: '100%', padding: '6px' }}
            tooltip="The percent of this asset's value added to your borrow capacity."
          ></StackedText>
        </Section>
        <Section width={SectionSize.THIRD}>
          <StackedText
            title="Total Supplied"
            text={toBalance(reserve?.totalSupplyFloat())}
            sx={{ width: '100%', padding: '6px' }}
          ></StackedText>
        </Section>
      </Row>
      <Row>
        <WithdrawAnvil poolId={safePoolId} assetId={safeAssetId} />
      </Row>
    </>
  );
};

export default Withdraw;
