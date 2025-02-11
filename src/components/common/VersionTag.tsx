import { Typography, TypographyProps, useTheme } from '@mui/material';

export interface VersionTagProps extends TypographyProps {
  version: 'v1' | 'v2';
}

export const VersionTag: React.FC<VersionTagProps> = ({ version, sx, ...props }) => {
  const theme = useTheme();
  return (
    <Typography
      variant="body1"
      sx={{
        backgroundColor:
          version == 'v1' ? theme.palette.primary.opaque : theme.palette.backstop.opaque,
        color: version == 'v1' ? theme.palette.primary.main : theme.palette.backstop.main,
        borderRadius: '5px',
        paddingLeft: '6px',
        paddingRight: '6px',
        ...sx,
      }}
      {...props}
    >
      {version}
    </Typography>
  );
};
