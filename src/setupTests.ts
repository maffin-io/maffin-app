// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import crypto from 'crypto';
import { Settings } from 'luxon';

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
