import { Box, BoxProps, Typography } from '@mui/material';

import { Reserve } from '@blend-capital/blend-sdk';
import { useTokenMetadataFromToml } from '../../hooks/api';
import { toCompactAddress } from '../../utils/formatter';
import { TokenIcon } from './TokenIcon';

export interface TokenHeaderProps extends BoxProps {
  reserve: Reserve;
  hideDomain?: boolean;
  iconSize?: string;
}

export const TokenHeader: React.FC<TokenHeaderProps> = ({
  reserve,
  sx,
  hideDomain,
  iconSize,
  ...props
}) => {
  const { data: tokenMetadata } = useTokenMetadataFromToml(reserve);

  if (tokenMetadata === undefined) {
    return <></>;
  }

  const domain =
    tokenMetadata?.domain === undefined || tokenMetadata.domain === ''
      ? toCompactAddress(tokenMetadata.issuer)
      : tokenMetadata.domain;
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        borderRadius: '5px',
        ...sx,
      }}
      {...props}
    >
      <TokenIcon
        reserve={reserve}
        sx={{ width: iconSize || '32px', height: iconSize || '32px', marginRight: '6px' }}
      />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        <Typography variant="body1">{tokenMetadata.code}</Typography>
        {!hideDomain && (
          <Typography variant="body2" color="text.secondary">
            {domain}
          </Typography>
        )}
      </Box>
    </Box>
  );
};
