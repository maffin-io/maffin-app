// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import crypto from 'crypto';
import { TextEncoder, TextDecoder } from 'util';

import { DateTime, Interval, Settings } from 'luxon';
import { QueryClient } from '@tanstack/react-query';

// https://github.com/chartjs/chartjs-adapter-luxon/issues/91
jest.mock('chartjs-adapter-luxon', jest.fn());

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

Object.defineProperty(global.self, 'crypto', {
  value: {
    randomUUID: () => crypto.randomUUID(),
  },
});

global.URL.createObjectURL = jest.fn();

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

jest.mock('chart.js', () => ({
  __esModule: true,
  ...jest.requireActual('chart.js'),
  Chart: {
    register: jest.fn(),
    defaults: {
      scale: {
        grid: {},
      },
    },
  },
}));

// set dark theme as default
window.matchMedia = jest.fn().mockReturnValue({ matches: true });

Settings.defaultZone = 'utc';
Settings.throwOnInvalid = true;
Settings.now = () => 1672531200000; // 2023-01-01

declare global {
  const TEST_INTERVAL: Interval;
  const QUERY_CLIENT: QueryClient;
}

Object.defineProperty(
  global,
  'TEST_INTERVAL',
  {
    // default interval for useInterval
    value: Interval.fromDateTimes(
      DateTime.now().minus({ month: 5 }).startOf('month'),
      DateTime.now().endOf('day'),
    ),
  },
);

Object.defineProperty(
  global,
  'QUERY_CLIENT',
  {
    value: new QueryClient({
      defaultOptions: {
        queries: {
          throwOnError: true,
        },
      },
    }),
  },
);

Object.assign(global, { TextDecoder, TextEncoder });
