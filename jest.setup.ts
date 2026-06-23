import React from 'react';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  Redirect: () => null,
  router: {
    replace: jest.fn(),
  },
}));
