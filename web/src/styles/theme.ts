import { extendTheme, ThemeConfig } from '@chakra-ui/react';

const themeConfig: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

export const customTheme = extendTheme({ 
  config: themeConfig,
  colors: {
    sideHover: 'rgba(0, 0, 0, 0.4)',
    sideBg: 'linear-gradient(90deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 100%);'
}});