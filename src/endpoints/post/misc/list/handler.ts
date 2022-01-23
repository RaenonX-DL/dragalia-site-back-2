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

  return handleListPost({
    mongoClient,
    payload,
    fnGetPostList: MiscPostController.getPostList,
    fnConstructResponse: (options) => new MiscPostListResponse(options),
    globalSubscriptionKeyName: 'ALL_MISC',
  });
};
