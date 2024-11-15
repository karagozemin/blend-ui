import { Circle } from '@mui/icons-material';
import { Box, Typography, useTheme } from '@mui/material';
import { useBackstop, usePool, usePoolOracle } from '../../hooks/api';
import { toBalance, toPercentage } from '../../utils/formatter';
import { estimateEmissionsApr } from '../../utils/math';
import { AprDisplay } from '../common/AprDisplay';
import { ReserveComponentProps } from '../common/ReserveComponentProps';
import { Row } from '../common/Row';
import { Section, SectionSize } from '../common/Section';

export const AssetBorrowInfo: React.FC<ReserveComponentProps> = ({ poolId, assetId }) => {
  const theme = useTheme();
  const { data: pool } = usePool(poolId);
  const { data: poolOracle } = usePoolOracle(pool);
  const { data: backstop } = useBackstop();
  const oraclePrice = poolOracle?.getPriceFloat(assetId);
  const reserve = pool?.reserves.get(assetId);
  const emissionsPerAsset = reserve?.emissionsPerYearPerBorrowedAsset();
  const emissionApr =
    backstop && emissionsPerAsset && emissionsPerAsset > 0 && oraclePrice
      ? estimateEmissionsApr(emissionsPerAsset, backstop.backstopToken, oraclePrice)
      : undefined;
  const hasData = pool && poolOracle && reserve && oraclePrice;
  return (
    <>
      {hasData && (
        <Section
          width={SectionSize.FULL}
          sx={{ padding: '6px', display: 'flex', flexDirection: 'column' }}
        >
          <Row sx={{ padding: '6px' }}>
            <Typography
              sx={{
                padding: '6px',
                display: 'flex',
                gap: '4px',
                alignItems: 'center',
              }}
              variant="body2"
              color={theme.palette.text.primary}
            >
              <Circle fontSize="inherit" sx={{ width: '8px', color: theme.palette.borrow.main }} />
              Borrow Info
            </Typography>
          </Row>
          <Row>
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
              <Typography sx={{ padding: '6px' }}>APR</Typography>
              <AprDisplay
                assetSymbol={reserve.tokenMetadata.symbol}
                assetApr={reserve.borrowApr}
                emissionSymbol={'BLND'}
                emissionApr={emissionApr}
                isSupply={false}
                direction={'horizontal'}
              />
            </Box>
          </Row>
          <Row>
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
              <Typography sx={{ padding: '6px' }}>Total Borrowed</Typography>
              <Typography sx={{ padding: '6px', color: theme.palette.borrow.main }}>
                {toBalance(reserve.totalLiabilitiesFloat() * oraclePrice)}
              </Typography>
            </Box>
          </Row>
          <Row>
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
              <Typography sx={{ padding: '6px' }}>Liability Factor</Typography>
              <Typography sx={{ padding: '6px' }}>
                {toPercentage(reserve.getLiabilityFactor())}
              </Typography>
            </Box>
          </Row>
        </Section>
      )}
    </>
  );
};
