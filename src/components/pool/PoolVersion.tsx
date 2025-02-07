import { BoxProps, Typography, useTheme } from '@mui/material';

export interface PoolVersionProps extends BoxProps {
  version: 'v1' | 'v2';
}

export const PoolVersion: React.FC<PoolVersionProps> = ({ version, ...props }) => {
  const theme = useTheme();
  return (
    <Typography
      variant="h4"
      sx={{
        marginLeft: '6px',
        fontSize: '12px',
        backgroundColor:
          version == 'v1' ? theme.palette.primary.opaque : theme.palette.backstop.opaque,
        color: version == 'v1' ? theme.palette.primary.main : theme.palette.backstop.main,
        borderRadius: '4px',
        padding: '2px',
      }}
    >
      {version}
    </Typography>
  );
};
