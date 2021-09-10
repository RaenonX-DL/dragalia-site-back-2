import {ApiResponseCode, MiscPostGetPayload} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';
import {processMiscGetPayload} from '../../../../utils/payload/post/misc';
import {HandlerParams} from '../../../lookup';
import {handleGetPost} from '../../base/handler/get';
import {ApiFailedResponse} from '../../base/response/failed';
import {MiscPostController} from '../controller';
import {MiscPostGetResponse} from './response';


export const handleGetMiscPost = async (
  {payload, mongoClient}: HandlerParams<MiscPostGetPayload>,
): Promise<ApiResponse> => {
  payload = processMiscGetPayload(payload);

  if (!payload.seqId) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_POST_ID_NOT_SPECIFIED, {httpCode: 400});
  }

  return handleGetPost(
    mongoClient,
    payload,
    (payload) => (
      MiscPostController.getMiscPost(mongoClient, payload.seqId, payload.lang, true)
    ),
    (getResult) => {
      return new MiscPostGetResponse(
        getResult.toResponseReady(),
      );
    },
  );
};
