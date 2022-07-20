require('dotenv').config({ path: `${process.env.GITPOD_REPO_ROOT}/site/.env` })

import * as nodemailer from "nodemailer";


import { SendinBlueTransport } from "./sendInBlueTransport";

const domain = process.env.BASE_DOMAIN || `example.com`
const to = process.env.GITPOD_GIT_USER_EMAIL || `test@example.com`

const fakeMail  = {
  "from": `"No Reply" <no-reply@${domain}>`,
  to,
  "subject": "Test email",
  "html": "<html><body><p><b>Html version:</b>local testing</p></body></html> ",
  "text": "Text version: local testing",
  "headers": {}
}


const apiKey = process.env.SENDINBLUE_API_KEY;
if (!apiKey) {
  throw new Error(`SENDINBLUE_API_KEY is required`)
}

const transport = nodemailer.createTransport(new SendinBlueTransport(apiKey));
transport.sendMail(fakeMail);
