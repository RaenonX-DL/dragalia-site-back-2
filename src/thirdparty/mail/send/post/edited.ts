import {EmailSendResult, PostType} from '../../../../api-def/api';
import {SubscriptionRecordController} from '../../data/subscription/controller';
import {SendMailOpts} from '../../make/base/type';
import {makeMailContentEdited} from '../../make/post/edited/make';
import {MakeMailContentEditedOpts} from '../../make/post/edited/type';
import {sendMail} from '../base';
import {PostTypeToSubscriptionKey} from './const';


type SendMailPostEditedProps = MakeMailContentEditedOpts & SendMailOpts & {
  postType: PostType,
  postId: number,
};

export const sendMailPostEdited = async (opts: SendMailPostEditedProps): Promise<EmailSendResult> => {
  const {lang, mongoClient, postType, postId: id} = opts;

  // Edit note might be an empty string
  opts.editNote = opts.editNote || '(N/A)';

  const recipients = await SubscriptionRecordController.getRecipients(
    mongoClient, lang, [{type: 'const', name: PostTypeToSubscriptionKey[postType]}, {type: 'post', postType, id}],
  );

  const mailContent = makeMailContentEdited(opts);

  return await sendMail({
    ...mailContent,
    lang,
    to: recipients,
  });
};
