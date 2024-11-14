import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useTheme } from '@mui/material';
import { useSettings, ViewType } from '../../contexts';
import { OpaqueButton } from '../common/OpaqueButton';
import { Row } from '../common/Row';
import { Section, SectionSize } from '../common/Section';
import { LinkBox } from './LinkBox';
import { ReserveDropdown } from './ReserveDropdown';

export const ReserveDetailsBar: React.FC<ReserveDropdown> = ({
  poolId,
  activeReserveId,
  action,
}) => {
  const { viewType } = useSettings();
  const theme = useTheme();
  return (
    <Row>
      {viewType === ViewType.REGULAR && (
        <>
          <Section width={SectionSize.LARGE}>
            <ReserveDropdown action={action} poolId={poolId} activeReserveId={activeReserveId} />
          </Section>
          <Section width={SectionSize.SMALL}>
            <LinkBox
              sx={{ width: '100%', height: '100%' }}
              to={{ pathname: 'asset', query: { poolId, assetId: activeReserveId } }}
            >
              <OpaqueButton
                palette={theme.palette.primary}
                sx={{
                  width: '100%',
                  height: '100%',
                  justifyContent: 'space-between',
                }}
              >
                Details
                <ArrowForwardIcon fontSize="inherit" />
              </OpaqueButton>
            </LinkBox>
          </Section>
        </>
      )}
      {viewType !== ViewType.REGULAR && (
        <>
          <Section width={SectionSize.EIGHTY}>
            <ReserveDropdown action={action} poolId={poolId} activeReserveId={activeReserveId} />
          </Section>
          <Section width={SectionSize.TWENTY}>
            <LinkBox
              sx={{ width: '100%', height: '100%' }}
              to={{ pathname: 'asset', query: { poolId, assetId: activeReserveId } }}
            >
              <OpaqueButton
                palette={theme.palette.primary}
                sx={{ minWidth: 'auto', width: '100%', height: '100%' }}
              >
                <ArrowForwardIcon fontSize="inherit" />
              </OpaqueButton>
            </LinkBox>
          </Section>
        </>
      )}
    </Row>
  );
};
