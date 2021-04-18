import {MongoClient} from 'mongodb';

import {PostModifyPayload, ApiResponseCode} from '../../../../api-def/api';
import {UpdateResult} from '../../../../base/enum/updateResult';
import {ApiResponse} from '../../../../base/response';
import {GoogleUserController} from '../../../userControl/controller';
import {ApiFailedResponse} from '../response/failed';
import {PostEditSuccessResponse} from '../response/post/edit';

type FunctionEditPost<P extends PostModifyPayload> = (
  mongoClient: MongoClient, payload: P
) => Promise<UpdateResult>;

type FunctionConstructResponse<R extends PostEditSuccessResponse> = (seqId: number) => R;

export const handleEditPost = async <P extends PostModifyPayload, R extends PostEditSuccessResponse>(
  mongoClient: MongoClient, payload: P,
  fnEditPost: FunctionEditPost<P>, fnConstructResponse: FunctionConstructResponse<R>,
): Promise<ApiResponse> => {
  if (!payload.seqId) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_POST_ID_NOT_SPECIFIED, 400);
  }

  // Check user privilege
  const isAdmin = await GoogleUserController.isAdmin(mongoClient, payload.googleUid);
  if (!isAdmin) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION, 401);
  }

  // Edit post
  const postGetResult = await fnEditPost(mongoClient, payload);
  if (postGetResult === 'NOT_FOUND') {
    return new ApiFailedResponse(ApiResponseCode.FAILED_POST_NOT_EXISTS, 404);
  }

  return fnConstructResponse(payload.seqId);
};
