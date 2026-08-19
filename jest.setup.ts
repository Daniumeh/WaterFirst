import React from 'react';

jest.mock('react-native-reanimated', () => {
  const ReactNative = require('react-native');

  const interpolate = (value: number, input: number[], output: number[]) => {
    if (value <= input[0]) return output[0];

    for (let index = 1; index < input.length; index += 1) {
      if (value <= input[index]) {
        const progress = (value - input[index - 1]) / (input[index] - input[index - 1]);

        return output[index - 1] + progress * (output[index] - output[index - 1]);
      }
    }

    return output[output.length - 1];
  };

  const Animated = {
    Text: ReactNative.Text,
    View: ReactNative.View,
    createAnimatedComponent: (Component: unknown) => Component,
  };

  return {
    __esModule: true,
    default: Animated,
    Easing: {
      cubic: (value: number) => value * value * value,
      inOut: (easing: unknown) => easing,
      out: (easing: unknown) => easing,
    },
    interpolate,
    interpolateColor: (_value: number, _input: number[], output: string[]) => output[0],
    useAnimatedStyle: (callback: () => object) => callback(),
    useReducedMotion: () => false,
    useSharedValue: (value: unknown) => ({ value }),
    withDelay: (_delay: number, value: unknown) => value,
    withRepeat: (value: unknown) => value,
    withSequence: (...values: unknown[]) => values[values.length - 1],
    withTiming: (value: unknown) => value,
  };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  Redirect: () => null,
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

jest.mock('expo-notifications', () => ({
  AndroidImportance: {
    DEFAULT: 'default',
  },
  SchedulableTriggerInputTypes: {
    DAILY: 'daily',
    DATE: 'date',
  },
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  getPermissionsAsync: jest.fn(async () => ({ granted: true, status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true, status: 'granted' })),
  scheduleNotificationAsync: jest.fn(async () => 'scheduled-notification-id'),
  setNotificationChannelAsync: jest.fn(async () => undefined),
  setNotificationHandler: jest.fn(),
}));
