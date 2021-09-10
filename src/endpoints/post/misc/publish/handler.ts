import {ApiResponseCode, MiscPostPublishPayload} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';
import {processMiscPublishPayload} from '../../../../utils/payload/post/misc';
import {HandlerParams} from '../../../lookup';
import {UserController} from '../../../userControl/controller';
import {handlePublishPost} from '../../base/handler/publish';
import {ApiFailedResponse} from '../../base/response/failed';
import {MiscPostController} from '../controller';
import {MiscPostPublishResponse} from './response';


export const handlePublishMiscPost = async (
  {payload, mongoClient}: HandlerParams<MiscPostPublishPayload>,
): Promise<ApiResponse> => {
  payload = processMiscPublishPayload(payload);

  // Check if the user has the admin privilege
  if (!await UserController.isAdmin(mongoClient, payload.uid)) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION);
  }

  return handlePublishPost(
    mongoClient,
    payload,
    MiscPostController.publishPost,
    (seqId) => new MiscPostPublishResponse(seqId),
  );
};
