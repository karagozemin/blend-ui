import { Box, SxProps, Theme } from '@mui/material';
import Image from 'next/image';

export interface IconProps {
  src: string;
  alt: string;
  height?: number;
  width?: number;
  isCircle?: boolean; // defaults to true
  sx?: SxProps<Theme>;
  onError?: (error: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export const Icon: React.FC<IconProps> = ({
  src,
  alt,
  height = 30,
  width = 30,
  isCircle = true,
  sx,
  onError,
}) => {
  return (
    <Box
      sx={{
        borderRadius: isCircle ? '50%' : '5px',
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        display: 'inline-block',
        ...sx,
      }}
    >
      <Image src={src} alt={alt} layout="fill" objectFit="cover" onError={onError} />
    </Box>
  );
};
