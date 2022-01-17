import {SupportedLanguages} from '../../../api-def/api';
import {isCi} from '../../../api-def/utils';
import {emailSenderAddress, mailTransporter} from '../client';
import {senderName} from '../const';
import {MailContent} from '../type';


type SendMailOptions = MailContent & {
  lang: SupportedLanguages,
  to: string[],
};

type SendMailReturn = {
  accepted: string[],
  rejected: string[],
};

export const sendMail = async ({
  lang, to, subject, text, html,
}: SendMailOptions): Promise<SendMailReturn> => {
  if (isCi()) {
    // Assume all sent in CI
    return {accepted: to, rejected: []};
  }

  if (!to.length) {
    return {accepted: [], rejected: []};
  }

  const {accepted, rejected} = await mailTransporter.sendMail({
    from: {name: senderName[lang], address: emailSenderAddress},
    to,
    subject,
    text,
    html,
  });

  return {
    accepted: accepted.map((address) => typeof address === 'string' ? address : address.address),
    rejected: rejected.map((address) => typeof address === 'string' ? address : address.address),
  };
};
