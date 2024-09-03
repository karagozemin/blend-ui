import { Reserve } from '@blend-capital/blend-sdk';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Box, Typography, useTheme } from '@mui/material';
import { ViewType, useSettings } from '../../contexts';
import * as formatter from '../../utils/formatter';

import { CustomButton } from '../common/CustomButton';
import { FlameIcon } from '../common/FlameIcon';
import { LinkBox } from '../common/LinkBox';
import { PoolComponentProps } from '../common/PoolComponentProps';
import { SectionBase } from '../common/SectionBase';
import { TokenHeader } from '../common/TokenHeader';

export interface BorrowMarketCardProps extends PoolComponentProps {
  reserve: Reserve;
}

export const BorrowMarketCard: React.FC<BorrowMarketCardProps> = ({
  poolId,
  reserve,
  sx,
  ...props
}) => {
  const theme = useTheme();
  const { viewType } = useSettings();

  const available = reserve.totalSupplyFloat() - reserve.totalLiabilitiesFloat();

  const tableNum = viewType === ViewType.REGULAR ? 5 : 3;
  const tableWidth = `${(100 / tableNum).toFixed(2)}%`;
  const liabilityFactor = reserve.getLiabilityFactor();

  return (
    <SectionBase
      sx={{
        type: 'alt',
        display: 'flex',
        width: '100%',
        padding: '6px',
        marginBottom: '12px',
        ...sx,
      }}
      {...props}
    >
      <LinkBox
        sx={{ width: '100%' }}
        to={{ pathname: '/borrow', query: { poolId: poolId, assetId: reserve.assetId } }}
      >
        <CustomButton
          sx={{
            width: '100%',
            '&:hover': {
              color: theme.palette.borrow.main,
            },
          }}
        >
          <TokenHeader reserve={reserve} sx={{ width: tableWidth }} />
          <Box
            sx={{
              width: tableWidth,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Typography variant="body1">{formatter.toBalance(available)}</Typography>
          </Box>

          <Box
            sx={{
              width: tableWidth,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Typography variant="body1">{formatter.toPercentage(reserve.borrowApr)}</Typography>
            {reserve.borrowEmissions && (
              <FlameIcon
                width={22}
                height={22}
                title={formatter.getEmissionTextFromValue(
                  reserve.emissionsPerYearPerBorrowedAsset(),
                  reserve.tokenMetadata?.symbol
                )}
              />
            )}
          </Box>
          {viewType !== ViewType.MOBILE && (
            <Box
              sx={{
                width: tableWidth,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Typography variant="body1">{formatter.toPercentage(liabilityFactor)}</Typography>
            </Box>
          )}
          <Box
            sx={{
              width: viewType === ViewType.MOBILE ? 'auto' : tableWidth,
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
          >
            <ArrowForwardIcon fontSize="inherit" />
          </Box>
        </CustomButton>
      </LinkBox>
    </SectionBase>
  );
};
