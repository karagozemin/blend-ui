import { Version } from '@blend-capital/blend-sdk';
import { Box, IconButton, useMediaQuery, useTheme } from '@mui/material';
import Image from 'next/image';
import { ViewType, useSettings } from '../../contexts';
import { useBackstop } from '../../hooks/api';
import { Row } from '../common/Row';
import { Section, SectionSize } from '../common/Section';
import { SectionBase } from '../common/SectionBase';
import { NavItem } from './NavItem';
import { NavMenu } from './NavMenu';
import { WalletMenu } from './WalletMenu';

export const NavBar = () => {
  const theme = useTheme();
  const { viewType, lastPool } = useSettings();
  
  // Mobile screen detection ile override
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery('(max-width:900px)');
  
  // Force compact view on mobile
  const effectiveViewType = (isMobile || isSmallScreen) ? ViewType.COMPACT : viewType;

  const { data: backstop } = useBackstop(Version.V1, lastPool == undefined);
  const poolId = (lastPool ? lastPool.id : backstop?.config?.rewardZone[0]) ?? '';

  return (
    <Row sx={{ height: '62px' }}>
      <SectionBase sx={{ width: '50px', margin: '6px' }}>
        <a href="https://blend.capital" target="_blank" rel="noreferrer">
          <IconButton sx={{ width: '79%', height: '79%', margin: '6px' }}>
            <Image src="/icons/blend_logo.svg" layout="fill" alt="Blend Logo" />
          </IconButton>
        </a>
      </SectionBase>
      
      {effectiveViewType === ViewType.REGULAR && (
        <Box
          sx={{
            width: '762px',
            height: '100%',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <Section width={SectionSize.LARGE}>
            <NavItem to={{ pathname: '/' }} title="Markets" sx={{ width: '25%' }} />
            <NavItem
              to={{ pathname: '/dashboard', query: { poolId } }}
              title="Dashboard"
              sx={{ width: '25%' }}
            />
            <NavItem
              to={{ pathname: '/backstop', query: { poolId } }}
              title="Backstop"
              sx={{ width: '25%' }}
            />
            <NavItem
              to={{ pathname: '/sentinel' }}
              title="Sentinel"
              sx={{ width: '25%' }}
            />
          </Section>
          <Section width={SectionSize.SMALL}>
            <WalletMenu />
          </Section>
        </Box>
      )}
      {effectiveViewType !== ViewType.REGULAR && (
        <SectionBase sx={{ width: 'calc(100% - 124px)', padding: '6px', margin: '6px' }}>
          <WalletMenu />
        </SectionBase>
      )}

      <SectionBase sx={{ width: '50px', margin: '6px' }}>
        <NavMenu />
      </SectionBase>
    </Row>
  );
};
