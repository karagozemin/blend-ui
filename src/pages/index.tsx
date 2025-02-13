import { Version } from '@blend-capital/blend-sdk';
import { useTheme } from '@mui/material';
import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { Divider } from '../components/common/Divider';
import { Row } from '../components/common/Row';
import { SectionBase } from '../components/common/SectionBase';
import { ToggleSlider } from '../components/common/ToggleSlider';
import { MarketCard } from '../components/markets/MarketCard';
import { useSettings } from '../contexts';
import { useBackstop } from '../hooks/api';

const Markets: NextPage = () => {
  const theme = useTheme();
  const { blockedPools, isV2Enabled, lastPool } = useSettings();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [version, setVersion] = useState(
    isV2Enabled && lastPool?.version ? lastPool?.version : Version.V1
  );
  const { data: backstop } = useBackstop(version);

  useEffect(() => {
    if (isV2Enabled && lastPool?.version) {
      setVersion(lastPool.version);
    }
  }, [lastPool]);

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
              { optionName: 'V1', palette: theme.palette.primary },
              { optionName: 'V2', palette: theme.palette.backstop },
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
