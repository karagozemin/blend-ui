import { Box, Button, ButtonBaseProps, PaletteColor, useTheme } from '@mui/material';
import React from 'react';

export interface ToggleSliderProps extends ButtonBaseProps {
  options: string[];
  selected: string;
  palette: PaletteColor;
  changeState: (value: any) => void;
  passedRef?: any;
}

export const ToggleSlider: React.FC<ToggleSliderProps> = ({
  options,
  selected,
  changeState,
  palette,
  sx,
  passedRef,
}) => {
  const theme = useTheme();
  const [selectedOption, setOption] = React.useState(selected);
  const handleChangeToggle = (selectOption: string) => {
    setOption(selectOption);
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
            background: option == selectedOption ? palette.opaque : theme.palette.menu.main,
            color: option == selectedOption ? palette.main : theme.palette.menu.contrastText,
            boxShadow: 'none',
            '&:hover': {
              background: option === selectedOption ? palette.opaque : theme.palette.menu.main,
              color: option === selectedOption ? palette.main : theme.palette.menu.contrastText,
              boxShadow: 'none',
            },
            ...sx,
          }}
          onClick={() => handleChangeToggle(option)}
        >
          {option}
        </Button>
      ))}
    </Box>
  );
};
