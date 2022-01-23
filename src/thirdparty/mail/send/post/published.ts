import {EmailSendResult, PostType} from '../../../../api-def/api';
import {SubscriptionRecordController} from '../../data/subscription/controller';
import {SendMailOpts} from '../../make/base/type';
import {makeMailContentPublished} from '../../make/post/published/make';
import {MakeMailContentPublishedOpts} from '../../make/post/published/type';
import {sendMail} from '../base';
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
