import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          module: "CommonJS",
          moduleResolution: "node",
          esModuleInterop: true,
          strict: true,
        },
      },
    ],
  },
  testMatch: ["**/tests/**/*.test.ts"],
};

export default config;
