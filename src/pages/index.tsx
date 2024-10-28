import type { NextPage } from 'next';
import { useState } from 'react';
import { Divider } from '../components/common/Divider';
import { Row } from '../components/common/Row';
import { SectionBase } from '../components/common/SectionBase';
import { MarketCard } from '../components/markets/MarketCard';
import { useSettings } from '../contexts';
import { useBackstop } from '../hooks/api';

const Markets: NextPage = () => {
  const { data: backstop } = useBackstop();

  const [currentIndex, setCurrentIndex] = useState(0);
  const { blockedPools } = useSettings();

  const rewardZone = [...(backstop?.config?.rewardZone ?? [])].reverse();

  function handlePoolLoaded(index: number) {
    if (index >= currentIndex) {
      setCurrentIndex(Math.min(currentIndex + 1, rewardZone.length));
    }
  }

  return (
    <>
      <Row>
        <SectionBase type="alt" sx={{ margin: '6px', padding: '6px' }}>
          Markets
        </SectionBase>
      </Row>
      <Divider />
      {rewardZone.slice(0, currentIndex + 1).map((poolId, index) => {
        if (!blockedPools.includes(poolId))
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
