import { extendTheme, ThemeConfig } from '@chakra-ui/react';

const themeConfig: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

export const customTheme = extendTheme({ config: themeConfig });