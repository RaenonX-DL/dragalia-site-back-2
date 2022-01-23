import {EmailSendResult} from '../../../../api-def/api';
import {SubscriptionRecordController} from '../../data/subscription/controller';
import {makeMailSiteAnnouncement} from '../../make/announcement/make';
import {MakeMailSiteAnnouncementOpts} from '../../make/announcement/type';
import {SendMailOpts} from '../../make/base/type';
import {sendMail} from '../base';


type SendMailSiteAnnouncementProps = MakeMailSiteAnnouncementOpts & SendMailOpts;

export const sendMailSiteAnnouncement = async (opts: SendMailSiteAnnouncementProps): Promise<EmailSendResult> => {
  const {lang, mongoClient} = opts;

  const recipients = await SubscriptionRecordController.getRecipients(
    mongoClient, lang, [{type: 'const', name: 'ANNOUNCEMENT'}],
  );

  const mailContent = makeMailSiteAnnouncement(opts);

  return await sendMail({
    ...mailContent,
    lang,
    to: recipients,
  });
};
