import {EmailSendResult} from '../../../../api-def/api';
import {SubscriptionRecordController} from '../../data/subscription/controller';
import {SendMailOpts} from '../../make/base/type';
import {makeMailTierUpdated} from '../../make/tier/make';
import {MakeMailTierUpdatedOpts} from '../../make/tier/type';
import {sendMail} from '../base';


type SendMailTierUpdatedProps = MakeMailTierUpdatedOpts & SendMailOpts;

export const sendMailTierUpdated = async (opts: SendMailTierUpdatedProps): Promise<EmailSendResult> => {
  const {lang, mongoClient} = opts;

  const recipients = await SubscriptionRecordController.getRecipients(
    mongoClient, lang, [{type: 'const', name: 'ALL_TIER'}],
  );

  const mailContent = makeMailTierUpdated(opts);

  return await sendMail({
    ...mailContent,
    lang,
    to: recipients,
  });
};
