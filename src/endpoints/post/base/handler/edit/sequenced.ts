import {MongoClient} from 'mongodb';

import {SequencedPostEditPayload, ApiResponseCode} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';
import {ApiFailedResponse} from '../../response/failed';
import {SequencedPostEditResponse} from '../../response/post/edit/sequenced';
import {PostEditResultCommon} from '../../type';
import {handleEditPost} from './base';
import {FunctionConstructResponse, FunctionEditPost} from './types';


export const handleEditSequencedPost = async <
  P extends SequencedPostEditPayload,
  R extends SequencedPostEditResponse,
  T extends PostEditResultCommon,
>(
  mongoClient: MongoClient,
  payload: P,
  fnEditPost: FunctionEditPost<P, T>,
  fnConstructResponse: FunctionConstructResponse<P, R, T>,
): Promise<ApiResponse> => {
  if (!payload.seqId) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_POST_ID_NOT_SPECIFIED, {httpCode: 400});
  }

  return handleEditPost(mongoClient, payload, fnEditPost, fnConstructResponse);
};
