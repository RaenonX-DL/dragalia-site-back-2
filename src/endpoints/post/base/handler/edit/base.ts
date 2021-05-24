import {MongoClient} from 'mongodb';

import {PostEditPayload} from '../../../../../api-def/api/post/base/payload/common';
import {ApiResponseCode} from '../../../../../api-def/api/responseCode';
import {ApiResponse} from '../../../../../base/response';
import {GoogleUserController} from '../../../../userControl/controller';
import {ApiFailedResponse} from '../../response/failed';
import {PostEditResponse} from '../../response/post/edit/common';
import {FunctionConstructResponse, FunctionEditPost} from './types';

export const handleEditPost = async <P extends PostEditPayload, R extends PostEditResponse>(
  mongoClient: MongoClient,
  payload: P,
  fnEditPost: FunctionEditPost<P>,
  fnConstructResponse: FunctionConstructResponse<P, R>,
): Promise<ApiResponse> => {
  // Check user privilege
  const isAdmin = await GoogleUserController.isAdmin(mongoClient, payload.googleUid);
  if (!isAdmin) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION, {httpCode: 401});
  }

  // Edit post
  const postGetResult = await fnEditPost(mongoClient, payload);
  if (postGetResult === 'NOT_FOUND') {
    return new ApiFailedResponse(ApiResponseCode.FAILED_POST_NOT_EXISTS, {httpCode: 404});
  }

  return fnConstructResponse(payload);
};
