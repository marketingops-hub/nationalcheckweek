import { defineConfig } from "checkly";
import { Frequency } from "checkly/constructs";

export default defineConfig({
  projectName: "National Check-In Week",
  logicalId: "nationalcheckinweek",
  repoUrl: "https://github.com/marketingops-hub/nationalcheckweek",
  checks: {
    activated: true,
    muted: false,
    runtimeId: "2024.02",
    frequency: Frequency.EVERY_5M,
    locations: ["ap-southeast-2", "us-east-1"],
    tags: ["nationalcheckinweek"],
    checkMatch: "**/__checks__/**/*.check.ts",
    browserChecks: {
      frequency: Frequency.EVERY_10M,
      testMatch: "**/__checks__/**/*.spec.ts",
    },
  },
  cli: {
    runLocation: "ap-southeast-2",
    privateRunLocation: undefined,
  },
});
