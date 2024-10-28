import { Reserve } from '@blend-capital/blend-sdk';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Box, Typography, useTheme } from '@mui/material';
import { useRouter } from 'next/router';
import { ViewType, useSettings } from '../../contexts';
import * as formatter from '../../utils/formatter';
import { FlameIcon } from '../common/FlameIcon';
import { LinkBox } from '../common/LinkBox';
import { OpaqueButton } from '../common/OpaqueButton';
import { PoolComponentProps } from '../common/PoolComponentProps';
import { TokenHeader } from '../common/TokenHeader';

export interface BorrowPositionCardProps extends PoolComponentProps {
  reserve: Reserve;
  dTokens: bigint;
}

export const BorrowPositionCard: React.FC<BorrowPositionCardProps> = ({
  poolId,
  reserve,
  dTokens,
  sx,
  ...props
}) => {
  const theme = useTheme();
  const { viewType } = useSettings();
  const router = useRouter();

  const assetFloat = reserve.toAssetFromDTokenFloat(dTokens);

  const tableNum = viewType === ViewType.REGULAR ? 5 : 3;
  const tableWidth = `${(100 / tableNum).toFixed(2)}%`;
  const buttonWidth = `${((100 / tableNum) * (viewType === ViewType.REGULAR ? 1.5 : 1)).toFixed(
    2
  )}%`;

  const emissionsPerAsset = reserve.emissionsPerYearPerBorrowedAsset();

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        '&:hover': {
          // color: viewType == ViewType.MOBILE ? theme.palette.borrow.main : 'inherit',
          cursor: viewType == ViewType.MOBILE ? 'pointer' : 'inherit',
        },
        backgroundColor: viewType == ViewType.MOBILE ? theme.palette.background.paper : 'inherit',
        padding: viewType == ViewType.MOBILE ? '1rem' : '0px',
        borderRadius: viewType == ViewType.MOBILE ? '6px' : '0px',
        boxShadow: viewType === ViewType.MOBILE ? '0px 4px 4px rgba(0, 0, 0, 0.25)' : 'none',
      }}
      onClick={() => {
        if (viewType === ViewType.MOBILE) {
          router.push({
            pathname: '/withdraw',
            query: { poolId: poolId, assetId: reserve.assetId },
          });
        }
      }}
    >
      <TokenHeader iconSize="24px" hideDomain reserve={reserve} sx={{ width: tableWidth }} />
      <Box
        sx={{
          width: tableWidth,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography variant="body1"> {formatter.toBalance(assetFloat)}</Typography>
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
        {emissionsPerAsset > 0 && (
          <FlameIcon
            width={22}
            height={22}
            title={formatter.getEmissionTextFromValue(
              emissionsPerAsset,
              reserve.tokenMetadata.symbol
            )}
          />
        )}
      </Box>
      {viewType !== ViewType.MOBILE && (
        <LinkBox
          to={{ pathname: '/repay', query: { poolId: poolId, assetId: reserve.assetId } }}
          sx={{
            display: 'flex',
            justifyContent: 'end',
            marginLeft: 'auto',
            // flexGrow: 1,
            alignItems: 'center',
            width: buttonWidth,
          }}
        >
          <OpaqueButton
            palette={theme.palette.borrow}
            sx={{
              width: '100%',
              margin: '6px',
              padding: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            Repay
            <ArrowForwardIcon fontSize="inherit" />
          </OpaqueButton>
        </LinkBox>
      )}
      {viewType === ViewType.MOBILE && (
        <LinkBox
          to={{ pathname: '/repay', query: { poolId: poolId, assetId: reserve.assetId } }}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <OpaqueButton
            palette={theme.palette.borrow}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: '100%',
              padding: '2px',
              width: '24px',
              minWidth: '24px',
              height: '24px',
            }}
          >
            <ArrowForwardIcon fontSize="inherit" />
          </OpaqueButton>
        </LinkBox>
      )}
    </Box>
  );
};
