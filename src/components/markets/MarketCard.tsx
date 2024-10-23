import { BackstopPoolEst, PoolEstimate } from '@blend-capital/blend-sdk';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SevereColdIcon from '@mui/icons-material/SevereCold';
import WarningIcon from '@mui/icons-material/Warning';
import { Box, Collapse, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import { useSettings } from '../../contexts';
import { useBackstop, useBackstopPool, usePool, usePoolOracle } from '../../hooks/api';
import { toBalance } from '../../utils/formatter';
import { LinkBox } from '../common/LinkBox';
import { OpaqueButton } from '../common/OpaqueButton';
import { PoolComponentProps } from '../common/PoolComponentProps';
import { Row } from '../common/Row';
import { Section, SectionSize } from '../common/Section';
import { Skeleton } from '../common/Skeleton';
import { StackedTextHLBox } from '../common/StackedTextHLBox';
import { TokenIcon } from '../common/TokenIcon';
import { PoolFrozenBanner } from '../pool/PoolFrozenBanner';
import { PoolHeader } from '../pool/PoolHeader';
import { PoolOnIceBanner } from '../pool/PoolOnIceBanner';
import { PoolOracleError } from '../pool/PoolOracleErrorBanner';
import { MarketCardCollapse } from './MarketCardCollapse';

export interface MarketCardProps extends PoolComponentProps {
  index: number;
  onLoaded: (index: number) => void;
}

export const MarketCard: React.FC<MarketCardProps> = ({ poolId, index, onLoaded, sx }) => {
  const theme = useTheme();
  const { trackPool } = useSettings();

  const { data: backstop } = useBackstop();
  const { data: pool } = usePool(poolId);
  const { data: poolOracle } = usePoolOracle(pool);
  const { data: backstopPool } = useBackstopPool(poolId);

  const [expand, setExpand] = useState(false);
  const [rotateArrow, setRotateArrow] = useState(false);

  const rotate = rotateArrow ? 'rotate(180deg)' : 'rotate(0)';

  useEffect(() => {
    if (pool !== undefined && backstopPool !== undefined && backstop !== undefined) {
      onLoaded(index);
      trackPool(poolId, pool.config.name);
    }
  }, [pool, backstopPool, backstop]);

  if (pool === undefined || backstopPool === undefined || backstop === undefined) {
    return <Skeleton height={'100px'} />;
  }

  const poolEst = poolOracle ? PoolEstimate.build(pool.reserves, poolOracle) : undefined;
  const backstopPoolEst = BackstopPoolEst.build(backstop.backstopToken, backstopPool.poolBalance);

  return (
    <Section width={SectionSize.FULL} sx={{ flexDirection: 'column', marginBottom: '12px', ...sx }}>
      <Box
        onClick={() => {
          setExpand(!expand);
          setRotateArrow(!rotateArrow);
        }}
        sx={{
          width: '100%',
          '&:hover': {
            cursor: 'pointer',
            filter: 'brightness(110%)',
          },
        }}
      >
        <Row>
          <PoolHeader name={pool.config.name} sx={{ margin: '6px', padding: '6px' }} />

          <Box
            sx={{
              margin: '6px',
              padding: '6px',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{ color: theme.palette.text.secondary, paddingRight: '12px', lineHeight: '100%' }}
            >
              Details
            </Box>
            <ArrowDropDownIcon
              sx={{
                color: theme.palette.text.secondary,
                transform: rotate,
                transition: 'all 0.2s linear',
              }}
            />
            {pool.config.status === 3 && <AcUnitIcon sx={{ marginLeft: '6px' }} />}
            {pool.config.status === 5 && <SevereColdIcon sx={{ marginLeft: '6px' }} />}
            {poolOracle === undefined && <WarningIcon sx={{ marginLeft: '6px' }} />}
          </Box>
        </Row>
        <Row>
          <StackedTextHLBox
            name="Supplied"
            text={`$${toBalance(poolEst?.totalSupply)}`}
            palette={theme.palette.lend}
            sx={{ width: '33.33%' }}
          ></StackedTextHLBox>
          <StackedTextHLBox
            name="Borrowed"
            text={`$${toBalance(poolEst?.totalBorrowed)}`}
            palette={theme.palette.borrow}
            sx={{ width: '33.33%' }}
          ></StackedTextHLBox>
          <StackedTextHLBox
            name="Backstop"
            text={`$${toBalance(backstopPoolEst.totalSpotValue)}`}
            palette={theme.palette.backstop}
            sx={{ width: '33.33%' }}
          ></StackedTextHLBox>
        </Row>
      </Box>
      <Row>
        <LinkBox
          sx={{ width: '100%', marginRight: '12px' }}
          to={{ pathname: '/dashboard', query: { poolId: poolId } }}
        >
          <OpaqueButton
            palette={theme.palette.primary}
            sx={{
              width: '100%',
              margin: '6px',
              padding: '6px',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box sx={{ margin: '6px', height: '30px', display: 'flex' }}>
              {Array.from(pool.reserves.values()).map((reserve) => {
                return (
                  <TokenIcon key={reserve.assetId} reserve={reserve} sx={{ marginRight: '6px' }} />
                );
              })}
            </Box>
            <Box sx={{ padding: '6px', display: 'flex', flexDirection: 'row', height: '30px' }}>
              <Box sx={{ paddingRight: '12px', lineHeight: '100%' }}>Dashboard</Box>
              <Box>
                <ArrowForwardIcon fontSize="inherit" />
              </Box>
            </Box>
          </OpaqueButton>
        </LinkBox>
      </Row>
      <Row>{pool.config.status === 3 && <PoolOnIceBanner />}</Row>
      <Row>{pool.config.status === 5 && <PoolFrozenBanner />}</Row>
      <Row>{poolOracle === undefined && <PoolOracleError />}</Row>

      <Collapse in={expand} sx={{ width: '100%' }}>
        <MarketCardCollapse
          pool={pool}
          poolEst={poolEst}
          backstopPool={backstopPool}
          backstopPoolEst={backstopPoolEst}
        ></MarketCardCollapse>
      </Collapse>
    </Section>
  );
};
