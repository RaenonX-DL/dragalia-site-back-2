import env from 'env-var';
import nodemailer from 'nodemailer';


export const emailSenderAddress = env.get('MAIL_SENDER')
  .required()
  .example('example@email.com')
  .asString();

export const mailTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: emailSenderAddress,
    pass: env.get('MAIL_PASSWORD').required().asString(),
  },
});
