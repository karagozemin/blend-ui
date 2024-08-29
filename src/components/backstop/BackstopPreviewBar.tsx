import { BackstopPoolEst, BackstopPoolUserEst } from '@blend-capital/blend-sdk';
import { HelpOutline } from '@mui/icons-material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Box, Tooltip, useTheme } from '@mui/material';
import { useSettings, ViewType } from '../../contexts';
import { useBackstop, useBackstopPool, useBackstopPoolUser } from '../../hooks/api';
import { toBalance } from '../../utils/formatter';
import { CustomButton } from '../common/CustomButton';
import { Icon } from '../common/Icon';
import { LinkBox } from '../common/LinkBox';
import { PoolComponentProps } from '../common/PoolComponentProps';
import { Row } from '../common/Row';
import { Skeleton } from '../common/Skeleton';
import { StackedText } from '../common/StackedText';
import { PoolStatusBox } from '../pool/PoolStatusBox';

export const BackstopPreviewBar: React.FC<PoolComponentProps> = ({ poolId }) => {
  const { viewType } = useSettings();
  const theme = useTheme();

  const { data: backstop } = useBackstop();
  const { data: backstopPoolData } = useBackstopPool(poolId);
  const { data: backstopUserData } = useBackstopPoolUser(poolId);

  if (backstop === undefined || backstopPoolData == undefined) {
    return <Skeleton />;
  }

  const backstopPoolEst = BackstopPoolEst.build(
    backstop.backstopToken,
    backstopPoolData.poolBalance
  );
  const backstopUserPoolEst =
    backstopUserData !== undefined
      ? BackstopPoolUserEst.build(backstop, backstopPoolData, backstopUserData)
      : undefined;

  const viewTypeRegular = viewType === ViewType.REGULAR;
  return (
    <Row
      sx={{
        padding: '0px 12px',
        flexDirection: viewTypeRegular ? undefined : 'column',
        gap: viewTypeRegular ? undefined : '12px',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: viewTypeRegular ? 'center' : undefined,
          width: viewTypeRegular ? '50%' : undefined,
          justifyContent: viewTypeRegular ? undefined : 'space-between',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: theme.palette.background.default,
            borderRadius: '5px',
          }}
        >
          <PoolStatusBox titleColor="inherit" type="large" status="Active" />
        </Box>
        <Tooltip
          title="The amount of capital insuring this pool."
          placement="top"
          enterTouchDelay={0}
          enterDelay={500}
          leaveTouchDelay={3000}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginLeft: 'auto',
              marginRight: '23px',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'row' }}>
              <StackedText
                title="Total Backstop Size"
                titleColor="inherit"
                text={`$${toBalance(backstopPoolEst.totalSpotValue)}`}
                textColor="inherit"
                type="large"
              />
              <HelpOutline
                sx={{
                  color: theme.palette.text.secondary,
                  width: '15px',
                  marginLeft: '4px',
                  marginTop: '-4px',
                }}
              />
            </Box>
            <Icon
              src={'/icons/dashboard/bkstp_size.svg'}
              alt={`backstop size icon`}
              sx={{ marginLeft: '12px' }}
            />
          </Box>
        </Tooltip>
      </Box>
      <LinkBox
        sx={{ width: viewTypeRegular ? '45%' : '100%', display: 'flex' }}
        to={{ pathname: '/backstop', query: { poolId: poolId } }}
      >
        <CustomButton
          sx={{
            width: '100%',
            padding: '12px',
            color: theme.palette.text.primary,
            backgroundColor: theme.palette.background.paper,
            '&:hover': {
              color: theme.palette.backstop.main,
            },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
            <Icon
              src={'/icons/dashboard/emissions_icon.svg'}
              alt={`emissions icon`}
              sx={{ marginRight: '12px' }}
            />
            <StackedText
              title="Your Backstop Balance"
              titleColor="inherit"
              text={
                backstopUserPoolEst ? `$${toBalance(backstopUserPoolEst.totalSpotValue)}` : '--'
              }
              textColor="inherit"
              type="large"
            />
          </Box>
          <ArrowForwardIcon fontSize="inherit" />
        </CustomButton>
      </LinkBox>
    </Row>
  );
};
