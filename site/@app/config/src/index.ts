// @ts-ignore
const packageJson = require("../../../package.json");

export const projectName = packageJson.description;
export const fromEmail =
  `"${projectName}" <no-reply@${process.env.BASE_DOMAIN}>`;
export const awsRegion = "us-east-1";
export const companyName = projectName; // For copyright ownership
export const emailLegalText =
  // Envvar here so we can override on the demo website
  process.env.LEGAL_TEXT || "";


export * from "./log"
