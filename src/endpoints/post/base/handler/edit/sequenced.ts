import {MongoClient} from 'mongodb';

import {SequencedPostEditPayload} from '../../../../../api-def/api/post/base/payload/sequenced';
import {ApiResponseCode} from '../../../../../api-def/api/responseCode';
import {ApiResponse} from '../../../../../base/response';
import {ApiFailedResponse} from '../../response/failed';
import {SequencedPostEditResponse} from '../../response/post/edit/sequenced';
import {handleEditPost} from './base';
import {FunctionConstructResponse, FunctionEditPost} from './types';

export const handleEditSequencedPost = async <P extends SequencedPostEditPayload, R extends SequencedPostEditResponse>(
  mongoClient: MongoClient,
  payload: P,
  fnEditPost: FunctionEditPost<P>,
  fnConstructResponse: FunctionConstructResponse<P, R>,
): Promise<ApiResponse> => {
  if (!payload.seqId) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_POST_ID_NOT_SPECIFIED, {httpCode: 400});
  }

  return handleEditPost(mongoClient, payload, fnEditPost, fnConstructResponse);
};
