import { Circle } from '@mui/icons-material';
import { Box, Typography, useTheme } from '@mui/material';
import { useSettings } from '../../contexts';
import { PoolComponentProps } from '../common/PoolComponentProps';
import { Row } from '../common/Row';
import { Section, SectionSize } from '../common/Section';
import { AssetGraphSupply } from './AssetGraphSupply';

export const AssetGraphBoxSupply: React.FC<PoolComponentProps> = ({ poolId }) => {
  const { viewType } = useSettings();
  const theme = useTheme();

  return (
    <>
      <Section
        width={SectionSize.FULL}
        sx={{ padding: '6px', display: 'flex', flexDirection: 'column' }}
      >
        <Row sx={{ padding: '6px' }}>
          <Typography
            sx={{
              width: '100%',
              padding: '6px',
              display: 'flex',
              gap: '4px',
              alignItems: 'center',
            }}
            variant="body2"
            color={theme.palette.text.primary}
          >
            <Circle fontSize="inherit" sx={{ width: '8px', color: theme.palette.lend.main }} />
            Supply Info
          </Typography>
        </Row>
        <Row>
          <Box
            sx={{
              width: '100%',
              padding: '6px',
              margin: '6px',
              borderRadius: '5px',
              display: 'flex',
              justifyContent: 'space-between',
              background: theme.palette.background.default,
            }}
          >
            <Typography sx={{ padding: '6px' }}>Total Supplied</Typography>
            <Typography sx={{ padding: '6px', color: theme.palette.lend.main }}>
              $888.888k
            </Typography>
          </Box>
        </Row>
        <Row>
          <Box
            sx={{
              width: '100%',
              padding: '6px',
              margin: '6px',
              borderRadius: '5px',
              display: 'flex',
              justifyContent: 'space-between',
              background: theme.palette.background.default,
            }}
          >
            <Typography sx={{ padding: '6px' }}>Collateral Factor</Typography>
            <Typography sx={{ padding: '6px' }}>88.88%</Typography>
          </Box>
        </Row>
        <Row>
          <AssetGraphSupply poolId={''} />
        </Row>
      </Section>
    </>
  );
};
