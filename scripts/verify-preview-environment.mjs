import { previewEnvironmentError } from "./preview-policy.mjs";
const error = previewEnvironmentError(process.env);
if (error) { console.error(error); process.exit(1); }
console.log("Isolated Preview environment verified.");
