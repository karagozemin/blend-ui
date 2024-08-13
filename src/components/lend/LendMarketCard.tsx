import { Reserve } from '@blend-capital/blend-sdk';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Box, Typography, useTheme } from '@mui/material';
import { ViewType, useSettings } from '../../contexts';
import { useStore } from '../../store/store';
import * as formatter from '../../utils/formatter';
import { getEmissionsPerYearPerUnit } from '../../utils/token';
import { CustomButton } from '../common/CustomButton';
import { FlameIcon } from '../common/FlameIcon';
import { LinkBox } from '../common/LinkBox';
import { PoolComponentProps } from '../common/PoolComponentProps';
import { SectionBase } from '../common/SectionBase';
import { TokenHeader } from '../common/TokenHeader';

export interface LendMarketCardProps extends PoolComponentProps {
  reserve: Reserve;
}

export const LendMarketCard: React.FC<LendMarketCardProps> = ({
  poolId,
  reserve,
  sx,
  ...props
}) => {
  const theme = useTheme();
  const { viewType } = useSettings();

  const userBalanceBigInt = useStore((state) => state.balances.get(reserve.assetId)) ?? BigInt(0);
  const useBalanceAsNum = Number(userBalanceBigInt) / 10 ** reserve.config.decimals;

  const tableNum = viewType === ViewType.REGULAR ? 5 : 3;
  const tableWidth = `${(100 / tableNum).toFixed(2)}%`;
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
        to={{ pathname: '/supply', query: { poolId: poolId, assetId: reserve.assetId } }}
      >
        <CustomButton
          sx={{
            width: '100%',
            '&:hover': {
              color: theme.palette.lend.main,
            },
          }}
        >
          <TokenHeader id={reserve.assetId} sx={{ width: tableWidth }} />
          <Box
            sx={{
              width: tableWidth,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Typography variant="body1">
              {formatter.toBalance(useBalanceAsNum, reserve.config.decimals)}
            </Typography>
          </Box>

          <Box
            sx={{
              width: tableWidth,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Typography variant="body1">
              {formatter.toPercentage(reserve.estimates.supplyApr)}
            </Typography>
            {reserve.supplyEmissions && (
              <FlameIcon
                width={22}
                height={22}
                title={formatter.getEmissionTextFromValue(
                  getEmissionsPerYearPerUnit(
                    reserve.supplyEmissions?.config.eps || BigInt(0),
                    reserve.estimates.supplied,
                    reserve.config.decimals
                  ),
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
              <Typography variant="body1">
                {formatter.toPercentage(reserve.getCollateralFactor())}
              </Typography>
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
