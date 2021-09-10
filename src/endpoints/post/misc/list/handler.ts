import {MiscPostListPayload} from '../../../../api-def/api';
import {processMiscListPayload} from '../../../../utils/payload/post/misc';
import {HandlerParams} from '../../../lookup';
import {handleListPost} from '../../base/handler/list';
import {MiscPostController} from '../controller';
import {MiscPostListResponse} from './response';


export const handleListMiscPost = async ({
  payload, mongoClient,
}: HandlerParams<MiscPostListPayload>): Promise<MiscPostListResponse> => {
  payload = processMiscListPayload(payload);

  return handleListPost(
    mongoClient,
    payload,
    MiscPostController.getPostList,
    (userData, postUnits) => {
      return new MiscPostListResponse(userData ? userData.isAdmin : false, postUnits);
    },
  );
};
