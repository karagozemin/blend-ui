import { AuctionType, Pool, ScaledAuction } from '@blend-capital/blend-sdk';
import { Box, Typography, useTheme } from '@mui/material';
import { toCompactAddress } from '../../utils/formatter';
import { DividerSection } from '../common/DividerSection';
import { PoolComponentProps } from '../common/PoolComponentProps';
import { Row } from '../common/Row';
import { Section, SectionSize } from '../common/Section';
import { StackedTextBox } from '../common/StackedTextBox';
import { BidList } from './BidList';
import { LotList } from './LotList';

export interface FilledAuctionCardProps extends PoolComponentProps {
  pool: Pool;
  auction: ScaledAuction;
  index: number;
}

export const FilledAuctionCard: React.FC<FilledAuctionCardProps> = ({ pool, auction, sx }) => {
  const theme = useTheme();

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

          <StackedTextBox
            name="Block Filled"
            text={`${auction.scaleBlock}`}
            sx={{ width: '50%' }}
          ></StackedTextBox>
        </Row>
      </Box>
      <LotList
        pool={pool}
        lot={auction.data.lot}
        type={
          auction.type === AuctionType.Interest || auction.type === AuctionType.BadDebt
            ? 'Underlying'
            : 'Collateral'
        }
      />
      <DividerSection />
      <BidList
        pool={pool}
        bid={auction.data.bid}
        type={auction.type === AuctionType.Interest ? 'Underlying' : 'Liability'}
      />

      <Box
        sx={{
          margin: '6px',
          padding: '6px',
          color: theme.palette.positive.main,
          background: theme.palette.positive.opaque,
          borderRadius: '5px',
        }}
      >
        <Typography variant="body1" align="center">
          Filled
        </Typography>
      </Box>
    </Section>
  );
};
