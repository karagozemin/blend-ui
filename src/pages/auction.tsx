import { BackstopPoolEst, BackstopPoolUserEst } from '@blend-capital/blend-sdk';
import { useTheme } from '@mui/material';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { AuctionCard } from '../components/auction/AuctionCard';
import { Divider } from '../components/common/Divider';
import { GoBackHeader } from '../components/common/GoBackHeader';
import { Row } from '../components/common/Row';
import {
  useBackstop,
  useBackstopPool,
  useBackstopPoolUser,
  useHorizonAccount,
  usePool,
  useTokenBalance,
} from '../hooks/api';

const Auction: NextPage = () => {
  const theme = useTheme();

  const router = useRouter();
  const { poolId } = router.query;
  const safePoolId = typeof poolId == 'string' && /^[0-9A-Z]{56}$/.test(poolId) ? poolId : '';

  const { data: pool } = usePool(safePoolId);
  const { data: backstop } = useBackstop();
  const { data: backstopPoolData } = useBackstopPool(safePoolId);
  const { data: userBackstopPoolData } = useBackstopPoolUser(safePoolId);
  const { data: horizonAccount } = useHorizonAccount();
  const { data: lpBalance } = useTokenBalance(
    backstop?.backstopToken?.id ?? '',
    undefined,
    horizonAccount
  );

  const backstopPoolEst =
    backstop !== undefined && backstopPoolData !== undefined
      ? BackstopPoolEst.build(backstop.backstopToken, backstopPoolData.poolBalance)
      : undefined;

  const backstopUserEst =
    userBackstopPoolData !== undefined && backstop !== undefined && backstopPoolData !== undefined
      ? BackstopPoolUserEst.build(backstop, backstopPoolData, userBackstopPoolData)
      : undefined;

  return (
    <>
      <Row>
        <GoBackHeader name={pool?.config?.name} />
      </Row>
      <Divider />
      <AuctionCard
        index={0}
        onLoaded={function (index: number): void {
          throw new Error('Function not implemented.');
        }}
        poolId={''}
      />
    </>
  );
};

export default Auction;
