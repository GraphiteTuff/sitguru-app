import { deploymentEnvironmentError } from "./preview-policy.mjs";
const error = deploymentEnvironmentError(process.env);
if (error) { console.error(error); process.exit(1); }
console.log("Deployment environment verified.");
