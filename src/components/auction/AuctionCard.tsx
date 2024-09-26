import { Pool } from '@blend-capital/blend-sdk';
import { Box, Typography, useTheme } from '@mui/material';
import Image from 'next/image';
import { DividerSection } from '../common/DividerSection';
import { OpaqueButton } from '../common/OpaqueButton';
import { PoolComponentProps } from '../common/PoolComponentProps';
import { Row } from '../common/Row';
import { Section, SectionSize } from '../common/Section';
import { StackedTextBox } from '../common/StackedTextBox';
import { TxOverview } from '../common/TxOverview';
import { Value } from '../common/Value';
import { BidList } from './BidList';
import { LotList } from './LotList';

export interface AuctionCardProps extends PoolComponentProps {
  pool: Pool;
  index: number;
  onLoaded: (index: number) => void;
}

export const AuctionCard: React.FC<AuctionCardProps> = ({ pool, sx }) => {
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
            Auction GXXX...XXXX
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
              *AUCTION TYPE*
            </Box>
          </Box>
        </Row>
        <Row>
          <StackedTextBox
            name="Started"
            text="20 SEP 00:00 UTC - Block XXX"
            sx={{ width: '50%' }}
          ></StackedTextBox>
          <StackedTextBox
            name="Current Block"
            text="Block XXX+n"
            sx={{ width: '50%' }}
          ></StackedTextBox>
        </Row>
      </Box>
      <LotList pool={pool} />
      <DividerSection />
      <BidList pool={pool} />
      <OpaqueButton palette={theme.palette.primary} sx={{ margin: '6px', padding: '6px' }}>
        Bid
      </OpaqueButton>
      <DividerSection />
      <TxOverview>
        <>
          <Value title="Oracle estimated profit" value={`00000 XXXX`} />
          <Value title="Block" value={`XXX`} />
          <Value
            title={
              <>
                <Image src="/icons/dashboard/gascan.svg" alt="blend" width={20} height={20} /> Gas
              </>
            }
            value={`0000 XLM`}
          />
          <Value title="Borrow capacity" value={`00000`} />
          <Value title="Borrow limit" value={`00000`} />
        </>
      </TxOverview>
    </Section>
  );
};
