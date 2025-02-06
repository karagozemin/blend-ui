import { Box, Button, ButtonBaseProps, PaletteColor, useTheme } from '@mui/material';
import React from 'react';

export interface ToggleSliderProps extends ButtonBaseProps {
  options: string[];
  selected: string;
  palette: PaletteColor;
  changeState: (value: any) => void;
  passedRef?: any;
  text?: string[];
}

export const ToggleSlider: React.FC<ToggleSliderProps> = ({
  options,
  selected,
  changeState,
  palette,
  sx,
  passedRef,
  text,
}) => {
  const theme = useTheme();

  const handleChangeToggle = (selectOption: string) => {
    changeState(selectOption);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        background: theme.palette.menu.main,
        borderRadius: '4px',
        margin: '4px',
        padding: '4px',
        ...sx,
      }}
    >
      {options.map((option, index) => (
        <Button
          key={index}
          ref={passedRef}
          variant="contained"
          sx={{
            height: '28px',
            background: option === selected ? palette.opaque : theme.palette.menu.main,
            color: option === selected ? palette.main : theme.palette.menu.contrastText,
            boxShadow: 'none',
            '&:hover': {
              background: option === selected ? palette.opaque : theme.palette.menu.main,
              color: option === selected ? palette.main : theme.palette.menu.contrastText,
              boxShadow: 'none',
            },
            ...sx,
          }}
          onClick={() => handleChangeToggle(option)}
        >
          {text !== undefined ? text.at(index) ?? option : option}
        </Button>
      ))}
    </Box>
  );
};
