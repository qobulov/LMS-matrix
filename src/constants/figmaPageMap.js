/**
 * Figma: LMS / Learning Management System (route → node map)
 * File: https://www.figma.com/design/KL77d7VrltkGaykSrEza6Q/
 *
 * Use with Figma MCP: get_design_context / get_screenshot — pass fileKey + nodeId (e.g. "1:3587").
 * Node ids are stable within the file; refresh this map when frames are renamed or restructured.
 *
 * To fill TBD entries: open the frame in Figma, copy link — `node-id=1-234` in URL → use nodeId `1:234`.
 * Or call MCP get_metadata({ fileKey }) without nodeId for page list, then drill with page node ids.
 */
export const FIGMA_FILE_KEY = "KL77d7VrltkGaykSrEza6Q";

/** README / route ↔ primary onboarding & auth frames */
export const FIGMA_FRAMES = {
  auth: {
    signInOnboarding1: "1:3587",
    signInOnboarding1Hero: "1:3588",
    signInOnboarding2: "1:3697",
    signInOnboarding2Hero: "1:3698",
    signInOnboarding3: "1:3745",
    signInOnboarding3Hero: "1:3746",
    signUpOnboarding1: "1:3793",
    signUpOnboarding1Hero: "1:3794",
    signUpOnboarding2: "1:3844",
    signUpOnboarding2Hero: "1:3845",
    signUpOnboarding3: "1:3896",
    signUpOnboarding3Hero: "1:3897",
  },
};

/**
 * README § "Frontend — Pages" ↔ Figma frame node-ids (string) or null until mapped.
 * Replace null with real ids from your file when Figma MCP quota is available.
 */
export const FIGMA_ROUTE_NODE_IDS = {
  home: null,
  catalog: null,
  courseDetail: null,
  lessonViewer: null,
  quiz: null,
  studentDashboard: null,
  instructorDashboard: null,
  instructorCreateCourse: null,
  certificates: null,
  profile: null,
  rewards: null,
  adminOverview: null,
  adminReports: null,
  adminUsers: null,
  publicVerify: null,
  login: null,
  register: null,
};
