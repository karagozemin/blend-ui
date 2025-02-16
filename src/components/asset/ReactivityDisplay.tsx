import { Box, BoxProps, useTheme } from '@mui/material';
import React from 'react';
import { StackedText } from '../common/StackedText';

export interface ReactivityDisplayProps extends BoxProps {
  reactivity: number;
}

export const ReactivityDisplay: React.FC<ReactivityDisplayProps> = ({ reactivity, sx }) => {
  const theme = useTheme();

  let reactivityLevel = 'None';
  if (reactivity > 3000) {
    reactivityLevel = 'High';
  } else if (reactivity > 2000) {
    reactivityLevel = 'Medium';
  } else {
    reactivityLevel = 'Low';
  }

  function getColorByCapacity(capacity: number) {
    if (capacity > 3000) {
      return theme.palette.error.main;
    } else if (capacity > 2000) {
      return theme.palette.warning.main;
    } else {
      return theme.palette.primary.main;
    }
  }
  return (
    <Box
      sx={{
        width: '100px',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        ...sx,
      }}
    >
      <StackedText
        title="Reactivity"
        text={reactivityLevel}
        textColor={getColorByCapacity(reactivity)}
        type="large"
        tooltip="The reactivity value dictates how quickly the rate modifier changes. The rate modifier increases when utilization is above target, and decreases when utilization is below target."
      />
    </Box>
  );
};
