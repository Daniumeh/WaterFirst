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
  backdrop: '#02070E',
  ink: '#03101C',
  midnight: '#051827',
  panel: '#081F31',
  card: '#0B263A',
  cardRaised: '#11344C',
  border: '#1A4964',
  cyan: '#20C7FF',
  cyanSoft: '#78E6FF',
  cyanDeep: '#008ED1',
  blue: '#147DFF',
  orange: '#FFB257',
  green: '#34E89A',
  coral: '#FF6868',
  text: '#F5FBFF',
  muted: '#9BB3C4',
  faint: '#617F95',
  glass: 'rgba(10, 36, 55, 0.86)',
  glassStrong: 'rgba(17, 52, 76, 0.92)',
  wash: 'rgba(32, 199, 255, 0.1)',
  line: 'rgba(120, 230, 255, 0.2)',
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 18,
  xl: 24,
};

export const shadow =
  Platform.OS === 'web'
    ? {
        boxShadow: '0 18px 42px rgba(32, 199, 255, 0.18)',
      }
    : {
        shadowColor: colors.cyan,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 22,
        elevation: 6,
      };

export const glassShadow =
  Platform.OS === 'web'
    ? {
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 18px 38px rgba(0,0,0,0.24)',
      }
    : {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 18,
        elevation: 5,
      };

export const type = {
  display: 'Inter_800ExtraBold',
  body: 'Inter_400Regular',
  data: 'Inter_700Bold',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
};

export const typography = {
  h1: {
    fontFamily: type.semibold,
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  h2: {
    fontFamily: type.semibold,
    fontSize: 12,
    fontWeight: '700' as const,
    lineHeight: 18,
  },
  body1: {
    fontFamily: type.body,
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  body2: {
    fontFamily: type.body,
    fontSize: 10,
    fontWeight: '400' as const,
    lineHeight: 14,
  },
};
