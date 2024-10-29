import { Box, BoxProps, Typography } from '@mui/material';
import { Row } from '../common/Row';
import { PoolIcon } from './PoolIcon';

export interface TrackedPoolProps extends BoxProps {
  name: string;
  id: string;
}

export const TrackedPool: React.FC<TrackedPoolProps> = ({ name, id, sx, ...props }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        borderRadius: '5px',
        padding: '12px',
        ...sx,
      }}
      {...props}
    >
      <PoolIcon name={name} sx={{ height: '30px', width: '30px', borderRadius: '50%' }} />
      <Row sx={{ flexDirection: 'column' }}>
        <Typography variant="h3" sx={{ marginLeft: '6px' }}>
          {`${name} Pool`}
        </Typography>
        <Typography variant="h3" sx={{ marginLeft: '6px', wordBreak: 'break-word' }}>
          {`${id}`}
        </Typography>
      </Row>
    </Box>
  );
};
