import {MiscPostIdCheckPayload} from '../../../../api-def/api';
import {processMiscIdCheckPayload} from '../../../../utils/payload/post/misc';
import {HandlerParams} from '../../../lookup';
import {handlePostIdCheck} from '../../base/handler/idCheck/main';
import {MiscPostController} from '../controller';
import {MiscPostIdCheckResponse} from './response';


export const handleMiscPostIdCheck = async (
  {payload, mongoClient}: HandlerParams<MiscPostIdCheckPayload>,
): Promise<MiscPostIdCheckResponse> => {
  payload = processMiscIdCheckPayload(payload);

  return handlePostIdCheck(
    mongoClient,
    payload,
    (payload) => MiscPostController.isPostIdAvailable(mongoClient, payload.lang, payload.seqId),
    (isAvailable) => {
      return new MiscPostIdCheckResponse(isAvailable);
    },
  );
};
