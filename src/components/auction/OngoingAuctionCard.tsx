import {
  Auction,
  AuctionType,
  parseResult,
  Pool,
  PoolContract,
  PoolUser,
  Positions,
  PositionsEstimate,
  RequestType,
  SubmitArgs,
} from '@blend-capital/blend-sdk';
import { Box, Typography, useTheme } from '@mui/material';
import { Asset, SorobanRpc } from '@stellar/stellar-sdk';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useWallet } from '../../contexts/wallet';
import {
  useBackstop,
  useHorizonAccount,
  usePoolOracle,
  usePoolUser,
  useTokenBalance,
} from '../../hooks/api';
import { RPC_DEBOUNCE_DELAY, useDebouncedState } from '../../hooks/debounce';
import { calculateAuctionOracleProfit } from '../../utils/auction';
import { toBalance, toCompactAddress } from '../../utils/formatter';
import { requiresTrustline } from '../../utils/horizon';
import { getErrorFromSim, SubmitError } from '../../utils/txSim';
import { AnvilAlert } from '../common/AnvilAlert';
import { DividerSection } from '../common/DividerSection';
import { OpaqueButton } from '../common/OpaqueButton';
import { PoolComponentProps } from '../common/PoolComponentProps';
import { Row } from '../common/Row';
import { Section, SectionSize } from '../common/Section';
import { StackedTextBox } from '../common/StackedTextBox';
import { TxOverview } from '../common/TxOverview';
import { Value } from '../common/Value';
import { ValueChange } from '../common/ValueChange';
import { BidList } from './BidList';
import { LotList } from './LotList';

export interface OngoingAuctionCardProps extends PoolComponentProps {
  pool: Pool;
  auction: Auction;
  currLedger: number;
  index: number;
}

export const OngoingAuctionCard: React.FC<OngoingAuctionCardProps> = ({
  pool,
  auction,
  sx,
  currLedger,
}) => {
  const theme = useTheme();
  const { walletAddress, connected, poolSubmit, createTrustlines, isLoading, txType } = useWallet();
  const { data: poolOracle } = usePoolOracle(pool);
  const { data: backstop } = useBackstop();
  const { data: horizonAccount } = useHorizonAccount();
  const { data: poolUser } = usePoolUser(pool);
  const [simResponse, setSimResponse] = useState<SorobanRpc.Api.SimulateTransactionResponse>();
  const [parsedSimResult, setParsedSimResult] = useState<Positions>();
  const [loadingEstimate, setLoadingEstimate] = useState<boolean>(false);

  const scaledAuction = auction.scale(currLedger)[0];
  const assetKeys = useMemo(() => {
    if (auction.type === AuctionType.Interest) {
      const assets = new Set(scaledAuction.data.lot.keys());
      for (const asset of Array.from(scaledAuction.data.bid.keys())) {
        assets.add(asset);
      }
      return Array.from(assets);
    }
    return [];
  }, [auction]);

  const assetBalances = new Map<string, bigint>();
  assetKeys.forEach((asset) =>
    assetBalances.set(
      asset,
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useTokenBalance(asset, pool.reserves.get(asset)?.tokenMetadata.asset, horizonAccount).data ??
        BigInt(0)
    )
  );

  const lpTokenBalance = useTokenBalance(
    Array.from(scaledAuction.data.bid.keys())[0],
    undefined,
    horizonAccount,
    auction.type === AuctionType.Interest || auction.type === AuctionType.BadDebt
  ).data;

  useDebouncedState(currLedger, RPC_DEBOUNCE_DELAY, txType, async () => {
    setSimResponse(undefined);
    setParsedSimResult(undefined);
    let response = await handleSubmitTransaction(true);
    if (response) {
      setSimResponse(response);
      if (SorobanRpc.Api.isSimulationSuccess(response)) {
        setParsedSimResult(parseResult(response, PoolContract.parsers.submit));
      }
    }
    setLoadingEstimate(false);
  });

  const auctionValue = useMemo(() => {
    if (poolOracle && backstop) {
      try {
        return calculateAuctionOracleProfit(
          scaledAuction.data,
          scaledAuction.type,
          pool,
          poolOracle,
          backstop.backstopToken
        );
      } catch (e) {
        console.error('Error calculating auction value', e);
      }
    }
    return undefined;
  }, [auction, pool, poolOracle, backstop]);

  const { trustlinesToAdd, hasTokenTrustline } = useMemo(() => {
    const trustlinesToAdd: Asset[] = [];
    let hasTokenTrustline = true;

    for (const asset of assetKeys) {
      const reserve = pool.reserves.get(asset);
      if (requiresTrustline(horizonAccount, reserve?.tokenMetadata?.asset)) {
        hasTokenTrustline = false;
        if (reserve?.tokenMetadata?.asset) {
          trustlinesToAdd.push(reserve.tokenMetadata.asset);
        }
        break;
      }
    }

    return { trustlinesToAdd, hasTokenTrustline };
  }, [assetKeys, pool, horizonAccount]);

  const handleAddAssetTrustline = async () => {
    if (connected && trustlinesToAdd.length > 0) {
      await createTrustlines(trustlinesToAdd);
    }
  };
  const AddTrustlineButton = (
    <OpaqueButton
      onClick={handleAddAssetTrustline}
      palette={theme.palette.warning}
      sx={{ margin: '6px', padding: '6px' }}
    >
      Add Trustlines
    </OpaqueButton>
  );
  const { reason, disabledType, extraContent, isError } = useMemo(() => {
    if (!hasTokenTrustline) {
      let submitError: SubmitError = {
        isSubmitDisabled: true,
        isError: true,
        isMaxDisabled: true,
        reason: 'Missing trustline for auction asset.',
        disabledType: 'warning',
        extraContent: AddTrustlineButton,
      };
      return submitError;
    } else {
      return getErrorFromSim('1', 0, isLoading, simResponse, undefined);
    }
  }, [hasTokenTrustline, isLoading, loadingEstimate, simResponse, theme.palette.warning]);

  const [newPoolUser, newPositionEstimate] = useMemo(() => {
    if (pool && poolOracle && parsedSimResult) {
      return [
        new PoolUser(walletAddress, parsedSimResult, new Map()),
        PositionsEstimate.build(pool, poolOracle, parsedSimResult),
      ];
    }
    return [undefined, undefined];
  }, [pool, poolOracle, parsedSimResult]);

  const handleSubmitTransaction = async (sim: boolean) => {
    if (!connected) return;

    let requestType: RequestType;
    switch (auction.type) {
      case AuctionType.Interest:
        requestType = RequestType.FillInterestAuction;
        break;
      case AuctionType.BadDebt:
        requestType = RequestType.FillBadDebtAuction;
        break;
      case AuctionType.Liquidation:
        requestType = RequestType.FillUserLiquidationAuction;
        break;
    }

    const submitArgs: SubmitArgs = {
      from: walletAddress,
      to: walletAddress,
      spender: walletAddress,
      requests: [
        {
          amount: BigInt(100),
          address: auction.user,
          request_type: requestType,
        },
      ],
    };

    return await poolSubmit(pool.id, submitArgs, sim);
  };
  return (
    <Section width={SectionSize.FULL} sx={{ flexDirection: 'column', marginBottom: '12px', ...sx }}>
      <Box
        sx={{
          width: '100%',
        }}
      >
        <Row>
          <Typography variant="h3" sx={{ margin: '12px' }}>
            Auction {toCompactAddress(auction.user)}
          </Typography>
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
              sx={{
                padding: '4px',
                color: theme.palette.positive.main,
                background: theme.palette.positive.opaque,
                borderRadius: '5px',
                lineHeight: '100%',
              }}
            >
              *{AuctionType[auction.type]}*
            </Box>
          </Box>
        </Row>
        <Row>
          <StackedTextBox
            name="Started"
            text={` ${auction.data.block} `}
            sx={{ width: '50%' }}
          ></StackedTextBox>
          {
            <StackedTextBox
              name="Current Block"
              text={`${currLedger}`}
              sx={{ width: '50%' }}
            ></StackedTextBox>
          }
        </Row>
      </Box>
      <LotList
        pool={pool}
        lot={scaledAuction.data.lot}
        type={
          auction.type === AuctionType.Interest || auction.type === AuctionType.BadDebt
            ? 'Underlying'
            : 'Collateral'
        }
      />
      <DividerSection />
      <BidList
        pool={pool}
        bid={scaledAuction.data.bid}
        type={auction.type === AuctionType.Interest ? 'Underlying' : 'Liability'}
      />

      <OpaqueButton
        palette={theme.palette.primary}
        sx={{ margin: '6px', padding: '6px' }}
        onClick={() => handleSubmitTransaction(false)}
      >
        Bid
      </OpaqueButton>
      <DividerSection />
      {!isError && (
        <TxOverview>
          {auctionValue && (
            <Value
              title="Oracle estimated profit"
              value={`${toBalance(auctionValue.lot - auctionValue.bid, 3)}`}
            />
          )}
          <Value title="Block" value={currLedger?.toString() ?? ''} />
          <Value
            title={
              <>
                <Image src="/icons/dashboard/gascan.svg" alt="blend" width={20} height={20} /> Gas
              </>
            }
            value={`${toBalance(BigInt((simResponse as any)?.minResourceFee ?? 0), 7)} XLM`}
          />
          {Array.from(scaledAuction.data.lot).map(([asset, amount]) => {
            const reserve = pool.reserves.get(asset);
            switch (auction.type) {
              case AuctionType.Interest:
                if (!reserve) return;
                return (
                  <ValueChange
                    key={asset}
                    title={`${asset} balance change`}
                    curValue={`${toBalance(
                      assetBalances.get(asset) ?? BigInt(0),
                      reserve.tokenMetadata.decimals
                    )} ${reserve.tokenMetadata.symbol}`}
                    newValue={`${toBalance(
                      (assetBalances.get(asset) ?? BigInt(0)) + amount,
                      reserve.tokenMetadata.decimals
                    )} ${reserve.tokenMetadata.symbol}`}
                  />
                );
              case AuctionType.BadDebt:
                return (
                  <ValueChange
                    title="Lp Token Balance"
                    curValue={`${toBalance(lpTokenBalance, 7)}%`}
                    newValue={`${toBalance(
                      (lpTokenBalance ?? BigInt(0)) +
                        Array.from(scaledAuction.data.lot.values())[0],
                      7
                    )}%`}
                  />
                );
              case AuctionType.Liquidation:
                if (!reserve) return;
                return (
                  <ValueChange
                    key={asset}
                    title={`${reserve.tokenMetadata.symbol} collateral`}
                    curValue={`${toBalance(poolUser?.getCollateralFloat(reserve) ?? 0)} ${
                      reserve.tokenMetadata.symbol
                    }`}
                    newValue={`${toBalance(newPoolUser?.getCollateralFloat(reserve) ?? 0)} ${
                      reserve.tokenMetadata.symbol
                    }`}
                  />
                );
            }
          })}
          {Array.from(scaledAuction.data.bid).map(([asset, _]) => {
            const reserve = pool.reserves.get(asset);
            switch (auction.type) {
              case AuctionType.Interest:
                return (
                  <ValueChange
                    title="Lp Token Balance"
                    curValue={`${toBalance(lpTokenBalance, 7)}%`}
                    newValue={`${toBalance(
                      (lpTokenBalance ?? BigInt(0)) -
                        Array.from(scaledAuction.data.bid.values())[0],
                      7
                    )}%`}
                  />
                );
              case AuctionType.BadDebt:
              case AuctionType.Liquidation:
                if (!reserve) return;
                return (
                  <ValueChange
                    key={asset}
                    title={`${reserve.tokenMetadata.symbol} liability`}
                    curValue={`${toBalance(poolUser?.getLiabilitiesFloat(reserve) ?? 0)} ${
                      reserve.tokenMetadata.symbol
                    }`}
                    newValue={`${toBalance(newPoolUser?.getLiabilitiesFloat(reserve) ?? 0)} ${
                      reserve.tokenMetadata.symbol
                    }`}
                  />
                );
            }
          })}
          {(auction.type === AuctionType.Liquidation || auction.type === AuctionType.BadDebt) && (
            <>
              <ValueChange
                title="Borrow capacity"
                curValue={`${toBalance(newPositionEstimate?.borrowCap)} USD`}
                newValue={`${toBalance(newPositionEstimate?.borrowCap)} USD`}
              />

              <Value
                title="Borrow limit"
                value={`${toBalance(newPositionEstimate?.borrowLimit)} USD`}
              />
            </>
          )}
        </TxOverview>
      )}
      {isError && (
        <AnvilAlert severity={disabledType!} message={reason} extraContent={extraContent} />
      )}
    </Section>
  );
};
