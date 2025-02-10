import { Box } from '@mui/material';
import { Networks } from '@stellar/stellar-sdk';
import { useRouter } from 'next/router';
import { ReactNode, useEffect } from 'react';
import { FaucetBanner } from '../components/common/FaucetBanner';
import { OverlayModal } from '../components/common/OverlayModal';
import { OverlayModalTOS } from '../components/common/OverlayModalTOS';
import { Row } from '../components/common/Row';
import { WalletWarning } from '../components/common/WalletWarning';
import { NavBar } from '../components/nav/NavBar';
import { useSettings, ViewType } from '../contexts';
import { useBackstop, usePool } from '../hooks/api';

export default function DefaultLayout({ children }: { children: ReactNode }) {
  const { viewType, trackPool, version: settingsVersion, setLastPool } = useSettings();
  const router = useRouter();
  const { poolId } = router.query;
  const safePoolId =
    typeof poolId == 'string' && /^[0-9A-Z]{56}$/.test(poolId) ? poolId : undefined;

  const isTestnet = process.env.NEXT_PUBLIC_PASSPHRASE === Networks.TESTNET;

  const { data: backstop } = useBackstop();
  const { data: pool } = usePool(safePoolId as string, safePoolId !== undefined);

  // get the last (oldest) pool in the reward zone
  const faucet_pool =
    backstop !== undefined && backstop.config.rewardZone.length > 0
      ? backstop.config.rewardZone[backstop.config.rewardZone.length - 1]
      : undefined;

  useEffect(() => {
    if (pool !== undefined) {
      trackPool(pool.id, pool.metadata.name, settingsVersion);
      setLastPool(pool.id, pool.metadata.name, settingsVersion);
    }
  }, [pool, trackPool]);

  const mainWidth = viewType <= ViewType.COMPACT ? '100%' : '886px';
  const mainMargin = viewType <= ViewType.COMPACT ? '0px' : '62px';
  return (
    <>
      <Box sx={{ height: '30px' }} />
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Box />
        <Box component="main" sx={{ width: mainWidth, minWidth: '350px' }}>
          <NavBar />
          <Box sx={{ marginLeft: mainMargin, marginRight: mainMargin }}>
            <Row>
              <WalletWarning />
            </Row>
            {faucet_pool !== undefined && isTestnet && (
              <Row>
                <FaucetBanner poolId={faucet_pool} />
              </Row>
            )}
            {children}
            <OverlayModal />
            <OverlayModalTOS />
          </Box>
        </Box>
        <Box />
      </Box>
    </>
  );
}
