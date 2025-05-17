/**
 * Jest Configuration
 * Following Semantic Seed Coding Standards for testing
 */
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['./jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-ble-plx|@react-native-async-storage/async-storage)/)',
  ],
  testMatch: ['**/__tests__/**/*.(test|spec).[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  collectCoverage: true,
  collectCoverageFrom: [
    'services/**/*.{js,jsx,ts,tsx}',
    'context/**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
  ],
  coverageReporters: ['text', 'lcov'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|less)$': '<rootDir>/__mocks__/styleMock.js',
  },
};