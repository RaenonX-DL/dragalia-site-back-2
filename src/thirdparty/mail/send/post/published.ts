import {PostType} from '../../../../api-def/api';
import {SubscriptionRecordController} from '../../data/subscription/controller';
import {SendMailOpts} from '../../make/base/type';
import {makeMailContentPublished} from '../../make/contentPublished/make';
import {MakeMailContentPublishedOpts} from '../../make/contentPublished/type';
import {sendMail} from '../base';
import {EmailSendResult} from '../type';
import {PostTypeToSubscriptionKey} from './const';


type SendMailPostPublishedProps = MakeMailContentPublishedOpts & SendMailOpts & {
  postType: PostType,
};

export const sendMailPostPublished = async (opts: SendMailPostPublishedProps): Promise<EmailSendResult> => {
  const {lang, mongoClient, postType} = opts;

  const recipients = await SubscriptionRecordController.getRecipients(
    mongoClient, lang, [{type: 'const', name: PostTypeToSubscriptionKey[postType]}],
  );

  const mailContent = makeMailContentPublished(opts);

  return await sendMail({
    ...mailContent,
    lang,
    to: recipients,
  });
};
