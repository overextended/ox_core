import { extendTheme, ThemeConfig } from '@chakra-ui/react';

const themeConfig: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

export const theme = extendTheme({
  config: themeConfig,
  components: {
    Button: {
      baseStyle: {
        borderRadius: 'none',
      },
    },
    Input: {
      baseStyle: {
        field: {
          borderRadius: 'none',
        },
      },
      variants: {
        outline: {
          field: {
            borderRadius: 0,
            borderLeft: 'none',
            borderTop: 'none',
            borderRight: 'none',
          },
        },
      },
      defaultProps: {
        variant: 'outline',
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          borderRadius: 'none',
          bg: 'rgba(0, 0, 0, 0.4)',
          boxShadow: 'none',
        },
      },
    },
  },
  colors: {
    sideHover: 'rgba(0, 0, 0, 0.4)',
    sideBg: 'linear-gradient(90deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 100%);',
  },
});
