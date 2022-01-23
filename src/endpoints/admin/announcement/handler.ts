import {ApiResponseCode, SiteAnnouncementPayload} from '../../../api-def/api';
import {sendMailSiteAnnouncement} from '../../../thirdparty/mail/send/announcement/send';
import {processPayloadBase} from '../../../utils/payload/base';
import {HandlerParams} from '../../lookup';
import {ApiFailedResponse} from '../../post/base/response/failed';
import {UserController} from '../../userControl/controller';
import {AdminSendAnnouncementResponse} from './response';


export const handleAdminSendAnnouncement = async ({
  payload,
  mongoClient,
}: HandlerParams<SiteAnnouncementPayload>): Promise<AdminSendAnnouncementResponse | ApiFailedResponse> => {
  const {uid, lang, title, markdown} = processPayloadBase(payload);

  const isAdmin = await UserController.isAdmin(mongoClient, uid);

  if (!isAdmin) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION);
  }

  const result = await sendMailSiteAnnouncement({mongoClient, lang, markdown, title});

  return new AdminSendAnnouncementResponse({result});
};
