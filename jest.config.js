module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  //setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Optional, if you have global setups
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  moduleNameMapper: {
    "\\.(css|less|scss|sss|styl)$": "<rootDir>/node_modules/jest-css-modules",
  },
};
