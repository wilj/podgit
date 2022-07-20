import * as nodemailer from "nodemailer";

import { SendinBlueTransport } from "./sendInBlueTransport"



const isTest = process.env.NODE_ENV === "test";
const isDev = process.env.MAIL_ENV !== "production";

let transporterPromise: Promise<nodemailer.Transporter>;

export default function getTransport(): Promise<nodemailer.Transporter> {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      if (isTest) {
        console.log('isTest: Using json transport');
        return nodemailer.createTransport({
          jsonTransport: true,
        });
      } else if (isDev) {
        console.log('isDev: Using mailhog SMTP transport');
        return nodemailer.createTransport({
          host: "mailhog",
          port: 1025,
          secure: false
        });
      } else {
        const apiKey = process.env.SENDINBLUE_API_KEY;
        console.log('isProd: Using sendinblue transport with api key', apiKey);
        if (!apiKey) {
          throw new Error("Misconfiguration: no SENDINBLUE_API_KEY");
        }
        return nodemailer.createTransport(new SendinBlueTransport(apiKey));
      }
    })();
  }
  return transporterPromise!;
}
