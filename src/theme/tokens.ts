import { Platform } from 'react-native';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  xxl: 40,
};

export const colors = {
  backdrop: '#202020',
  ink: '#03111F',
  midnight: '#061B2E',
  panel: '#0A2033',
  card: '#0D263A',
  cardRaised: '#123047',
  border: '#1C4058',
  cyan: '#18BFFF',
  cyanSoft: '#67DFFF',
  cyanDeep: '#008ED1',
  orange: '#FF9A3D',
  green: '#28D77B',
  text: '#F5FBFF',
  muted: '#8EA5B7',
  faint: '#5F788D',
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 28,
};

export const shadow =
  Platform.OS === 'web'
    ? {
        boxShadow: '0 18px 42px rgba(24, 191, 255, 0.28)',
      }
    : {
        shadowColor: colors.cyan,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.28,
        shadowRadius: 24,
        elevation: 6,
      };
