import env from 'env-var';
import nodemailer from 'nodemailer';

import {isCi} from '../../api-def/utils';


export const emailSenderAddress = env.get('MAIL_SENDER')
  .required(!isCi())
  .example('example@email.com')
  .asString();

export const mailTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: emailSenderAddress || 'example@email.com',
    pass: env.get('MAIL_PASSWORD').required(!isCi()).asString() || '',
  },
});
