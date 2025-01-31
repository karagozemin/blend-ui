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
  children,
  palette,
  sx,
  passedRef,
  ...props
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
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        color: theme.palette.menu.main,
        background: theme.palette.menu.opaque,
        ...sx,
      }}
    >
      {options.map((option, index) => (
        <Button
          key={index}
          ref={passedRef}
          variant="contained"
          sx={{
            background:
              option == selectedOption ? theme.palette.positive.opaque : theme.palette.menu.main,
            color:
              option == selectedOption
                ? theme.palette.positive.main
                : theme.palette.menu.contrastText,
            '&:hover': { background: theme.palette.positive.opaque, color: 'white' },
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
