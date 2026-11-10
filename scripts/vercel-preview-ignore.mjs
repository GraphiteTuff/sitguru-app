import { previewEnvironmentError } from "./preview-policy.mjs";
const error = previewEnvironmentError(process.env);
console.log(error ? `Preview skipped: ${error}` : "Isolated feature Preview build allowed.");
process.exit(error ? 0 : 1);
