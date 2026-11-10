import { deploymentEnvironmentError } from "./preview-policy.mjs";
const error = deploymentEnvironmentError(process.env);
console.log(error ? `Deployment skipped: ${error}` : "Approved branch environment may build.");
// Vercel exit 0 skips; exit 1 permits a build.
process.exit(error ? 0 : 1);
