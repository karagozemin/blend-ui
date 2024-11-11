import { Circle } from '@mui/icons-material';
import { Box, Typography, useTheme } from '@mui/material';
import { usePool, usePoolOracle } from '../../hooks/api';
import { toBalance, toPercentage } from '../../utils/formatter';
import { ReserveComponentProps } from '../common/ReserveComponentProps';
import { Row } from '../common/Row';
import { Section, SectionSize } from '../common/Section';
import { AssetGraphBorrow } from './AssetGraphBorrow';

export const AssetGraphBoxBorrow: React.FC<ReserveComponentProps> = ({ poolId, assetId }) => {
  const theme = useTheme();
  const { data: pool } = usePool(poolId);
  const { data: poolOracle } = usePoolOracle(pool);
  const oraclePrice = poolOracle?.getPriceFloat(assetId);
  const reserve = pool?.reserves.get(assetId);
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
                width: '100%',
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
          <Row>
            <AssetGraphBorrow poolId={poolId} assetId={assetId} />
          </Row>
        </Section>
      )}
    </>
  );
};
