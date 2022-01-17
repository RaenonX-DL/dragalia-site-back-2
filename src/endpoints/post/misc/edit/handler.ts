import {MiscPostEditPayload} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';
import {processMiscEditPayload} from '../../../../utils/payload/post/misc';
import {HandlerParams} from '../../../lookup';
import {handleEditSequencedPost} from '../../base/handler/edit/sequenced';
import {MiscPostController} from '../controller';
import {MiscPostEditResponse} from './response';


export const handleEditMiscPost = async (
  {payload, mongoClient}: HandlerParams<MiscPostEditPayload>,
): Promise<ApiResponse> => {
  payload = processMiscEditPayload(payload);

  return handleEditSequencedPost(
    mongoClient,
    payload,
    MiscPostController.editMiscPost,
    ({seqId}, result) => new MiscPostEditResponse(seqId, result),
  );
};
