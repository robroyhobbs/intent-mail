import { createTheme, alpha, PaletteMode } from '@mui/material/styles';

/**
 * ArcBlock Brand Theme
 * Based on official ArcBlock brand guidelines
 */

// ArcBlock Brand Colors
const arcblockColors = {
  primary: '#4598fa',
  secondary: {
    light: '#00b8db',
    dark: '#00d3f3',
  },
  success: {
    light: '#28A948',
    dark: '#00AD3A',
  },
  warning: {
    light: '#ff9300',
    dark: '#FFAE00',
  },
  error: {
    light: '#fb2c36',
    dark: '#ff6467',
  },
  didAccent: '#49C3AD',
};

// Create theme based on mode
export const getTheme = (mode: PaletteMode) => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: arcblockColors.primary,
        light: '#6bb3fc',
        dark: '#2d7de8',
      },
      secondary: {
        main: isDark ? arcblockColors.secondary.dark : arcblockColors.secondary.light,
      },
      success: {
        main: isDark ? arcblockColors.success.dark : arcblockColors.success.light,
      },
      warning: {
        main: isDark ? arcblockColors.warning.dark : arcblockColors.warning.light,
      },
      error: {
        main: isDark ? arcblockColors.error.dark : arcblockColors.error.light,
      },
      background: {
        default: isDark ? '#0f1419' : '#f8fafc',
        paper: isDark ? '#1a2027' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f1f5f9' : '#1e293b',
        secondary: isDark ? '#94a3b8' : '#64748b',
      },
      divider: isDark ? '#2d3a4a' : '#e2e8f0',
    },
    typography: {
      // ArcBlock brand fonts
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: {
        fontFamily: '"Bai Jamjuree", "Inter", sans-serif',
        fontSize: '2.25rem',
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontFamily: '"Bai Jamjuree", "Inter", sans-serif',
        fontSize: '1.875rem',
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h3: {
        fontFamily: '"Bai Jamjuree", "Inter", sans-serif',
        fontSize: '1.5rem',
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      h4: {
        fontFamily: '"Bai Jamjuree", "Inter", sans-serif',
        fontSize: '1.25rem',
        fontWeight: 600,
      },
      h5: {
        fontFamily: '"Bai Jamjuree", "Inter", sans-serif',
        fontSize: '1.125rem',
        fontWeight: 600,
      },
      h6: {
        fontFamily: '"Bai Jamjuree", "Inter", sans-serif',
        fontSize: '1rem',
        fontWeight: 600,
      },
      body1: {
        fontSize: '0.9375rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
      button: {
        fontFamily: '"Lexend", "Inter", sans-serif',
        fontWeight: 500,
        textTransform: 'none' as const,
      },
      caption: {
        fontSize: '0.75rem',
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '@import': [
            "url('https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Lexend:wght@400;500;600&display=swap')",
          ],
          body: {
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: isDark ? '#3d4a5c' : '#cbd5e1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 16px',
            fontWeight: 500,
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: `0 4px 12px ${alpha(arcblockColors.primary, 0.3)}`,
            },
          },
          outlined: {
            borderWidth: 1.5,
            '&:hover': {
              borderWidth: 1.5,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: isDark
              ? '0 1px 3px rgba(0,0,0,0.3)'
              : '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
            border: `1px solid ${isDark ? '#2d3a4a' : '#e2e8f0'}`,
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: 20,
            '&:last-child': {
              paddingBottom: 20,
            },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: `1px solid ${isDark ? '#2d3a4a' : '#e2e8f0'}`,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: '2px 8px',
            '&.Mui-selected': {
              backgroundColor: alpha(arcblockColors.primary, isDark ? 0.15 : 0.1),
              '&:hover': {
                backgroundColor: alpha(arcblockColors.primary, isDark ? 0.2 : 0.15),
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 500,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          size: 'small',
        },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontFamily: '"Bai Jamjuree", "Inter", sans-serif',
            fontSize: '1.25rem',
            fontWeight: 600,
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            height: 3,
            borderRadius: '3px 3px 0 0',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            minHeight: 48,
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              fontWeight: 600,
              backgroundColor: isDark ? '#1a2027' : '#f8fafc',
            },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 6,
            fontSize: '0.8125rem',
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 8,
            border: `1px solid ${isDark ? '#2d3a4a' : '#e2e8f0'}`,
          },
        },
      },
    },
  });
};

// Default theme (light mode)
export const theme = getTheme('light');

// Export colors for component use
export const brandColors = arcblockColors;

// Simple gradient for accent use
export const gradients = {
  primary: `linear-gradient(135deg, ${arcblockColors.primary} 0%, #2d7de8 100%)`,
  secondary: `linear-gradient(135deg, #00b8db 0%, #00d3f3 100%)`,
};
