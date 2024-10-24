import React from 'react';

import { Reserve } from '@blend-capital/blend-sdk';
import { Theme } from '@emotion/react';
import { SxProps } from '@mui/material';
import { useTokenMetadataFromToml } from '../../hooks/api';
import { Icon } from './Icon';
import { LetterIcon } from './LetterIcon';

export interface TokenIconProps {
  reserve: Reserve;
  height?: string;
  width?: string;
  sx?: SxProps<Theme> | undefined;
}
export const TokenIcon: React.FC<TokenIconProps> = ({ reserve, ...props }) => {
  const { data: stellarTokenMetadata } = useTokenMetadataFromToml(reserve);

  if (stellarTokenMetadata?.image) {
    return (
      <Icon src={stellarTokenMetadata.image} alt={`${stellarTokenMetadata.code}`} {...props} />
    );
  } else {
    const code = stellarTokenMetadata?.code || 'Soroban Token';
    // return circle with capitalized first letter of the symbol
    return <LetterIcon text={code.charAt(0).toUpperCase()} {...props} />;
  }
};
