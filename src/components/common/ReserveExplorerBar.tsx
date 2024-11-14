import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useTheme } from '@mui/material';
import { useSettings, ViewType } from '../../contexts';
import { usePool } from '../../hooks/api';
import { getTokenLinkFromReserve } from '../../utils/token';
import { OpaqueButton } from '../common/OpaqueButton';
import { Row } from '../common/Row';
import { Section, SectionSize } from '../common/Section';
import { ReserveComponentProps } from './ReserveComponentProps';
import { ReserveDropdown } from './ReserveDropdown';

export const ReserveExploreBar: React.FC<ReserveComponentProps> = ({ poolId, assetId }) => {
  const { viewType } = useSettings();
  const theme = useTheme();
  const { data: pool } = usePool(poolId);
  const reserve = pool?.reserves.get(assetId);
  const link = reserve ? getTokenLinkFromReserve(reserve) : '';
  return (
    <Row>
      {viewType === ViewType.REGULAR && (
        <>
          <Section width={SectionSize.LARGE}>
            <ReserveDropdown action="asset" poolId={poolId} activeReserveId={assetId} />
          </Section>
          <Section width={SectionSize.SMALL}>
            <OpaqueButton
              palette={theme.palette.primary}
              sx={{
                width: '100%',
                height: '100%',
                justifyContent: 'space-between',
              }}
              onClick={() => window.open(link, '_blank')}
            >
              Explorer
              <OpenInNewIcon fontSize="inherit" />
            </OpaqueButton>
          </Section>
        </>
      )}
      {viewType !== ViewType.REGULAR && (
        <>
          <Section width={SectionSize.EIGHTY}>
            <ReserveDropdown action="asset" poolId={poolId} activeReserveId={assetId} />
          </Section>
          <Section width={SectionSize.TWENTY}>
            <OpaqueButton
              palette={theme.palette.primary}
              onClick={() => window.open(link, '_blank')}
              sx={{ minWidth: 'auto', width: '100%' }}
            >
              <OpenInNewIcon fontSize="inherit" />
            </OpaqueButton>
          </Section>
        </>
      )}
    </Row>
  );
};
