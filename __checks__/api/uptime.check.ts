import { ApiCheck, AssertionBuilder, Frequency } from "checkly/constructs";

const BASE_URL = "https://nationalcheckinweek.com";

new ApiCheck("homepage-up", {
  name: "Homepage — 200 OK",
  activated: true,
  frequency: Frequency.EVERY_5M,
  locations: ["ap-southeast-2", "us-east-1"],
  request: {
    url: `${BASE_URL}/`,
    method: "GET",
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.responseTime().lessThan(5000),
    ],
  },
});

new ApiCheck("states-listing-up", {
  name: "States listing — 200 OK",
  activated: true,
  frequency: Frequency.EVERY_5M,
  locations: ["ap-southeast-2", "us-east-1"],
  request: {
    url: `${BASE_URL}/states`,
    method: "GET",
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.responseTime().lessThan(5000),
    ],
  },
});

new ApiCheck("issues-listing-up", {
  name: "Issues listing — 200 OK",
  activated: true,
  frequency: Frequency.EVERY_5M,
  locations: ["ap-southeast-2", "us-east-1"],
  request: {
    url: `${BASE_URL}/issues`,
    method: "GET",
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.responseTime().lessThan(5000),
    ],
  },
});

new ApiCheck("admin-login-up", {
  name: "Admin login page — 200 OK",
  activated: true,
  frequency: Frequency.EVERY_5M,
  locations: ["ap-southeast-2", "us-east-1"],
  request: {
    url: `${BASE_URL}/admin/login`,
    method: "GET",
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.responseTime().lessThan(5000),
    ],
  },
});

new ApiCheck("victoria-state-up", {
  name: "Victoria state page — 200 OK",
  activated: true,
  frequency: Frequency.EVERY_5M,
  locations: ["ap-southeast-2", "us-east-1"],
  request: {
    url: `${BASE_URL}/states/victoria`,
    method: "GET",
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.responseTime().lessThan(8000),
    ],
  },
});

new ApiCheck("nsw-state-up", {
  name: "NSW state page — 200 OK",
  activated: true,
  frequency: Frequency.EVERY_10M,
  locations: ["ap-southeast-2"],
  request: {
    url: `${BASE_URL}/states/new-south-wales`,
    method: "GET",
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.responseTime().lessThan(8000),
    ],
  },
});
