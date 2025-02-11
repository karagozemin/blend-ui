import { useTheme } from '@mui/material';
import type { NextPage } from 'next';
import { useState } from 'react';
import { Divider } from '../components/common/Divider';
import { Row } from '../components/common/Row';
import { SectionBase } from '../components/common/SectionBase';
import { ToggleSlider } from '../components/common/ToggleSlider';
import { MarketCard } from '../components/markets/MarketCard';
import { useSettings } from '../contexts';
import { useBackstop } from '../hooks/api';

const Markets: NextPage = () => {
  const theme = useTheme();
  const { data: backstop } = useBackstop();

  const [currentIndex, setCurrentIndex] = useState(0);
  const { blockedPools, version, setVersion, isV2Enabled } = useSettings();

  const rewardZone = [...(backstop?.config?.rewardZone ?? [])].reverse();

  const safeRewardZone = rewardZone.filter((poolId) => !blockedPools.includes(poolId));

  function handlePoolLoaded(index: number) {
    if (index >= currentIndex) {
      setCurrentIndex(Math.min(currentIndex + 1, safeRewardZone.length));
    }
  }

  return (
    <>
      <Row sx={{ alignItems: 'center' }}>
        <SectionBase type="alt" sx={{ margin: '6px', padding: '6px' }}>
          Markets
        </SectionBase>

        {isV2Enabled && (
          <ToggleSlider
            options={[
              { optionName: 'v1', palette: theme.palette.primary },
              { optionName: 'v2', palette: theme.palette.backstop },
            ]}
            selected={version}
            changeState={setVersion}
            sx={{ height: '24px', width: '80px' }}
          />
        )}
      </Row>
      <Divider />
      {safeRewardZone.slice(0, currentIndex + 1).map((poolId, index) => {
        return (
          <MarketCard
            key={poolId}
            poolId={poolId}
            index={index}
            onLoaded={handlePoolLoaded}
          ></MarketCard>
        );
      })}
    </>
  );
};

export default Markets;
