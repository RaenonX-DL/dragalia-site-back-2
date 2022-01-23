import {MongoClient} from 'mongodb';

import {ApiResponseCode, PostEditPayload} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';
import {UserController} from '../../../../userControl/controller';
import {ApiFailedResponse} from '../../response/failed';
import {PostEditResponse} from '../../response/post/edit/common';
import {PostEditResultCommon} from '../../type';
import {FunctionConstructResponse, FunctionEditPost} from './types';


export const handleEditPost = async <
  P extends PostEditPayload,
  R extends PostEditResponse,
  T extends PostEditResultCommon,
>(
  mongoClient: MongoClient,
  payload: P,
  fnEditPost: FunctionEditPost<P, T>,
  fnConstructResponse: FunctionConstructResponse<P, R, T>,
): Promise<ApiResponse> => {
  // Check user privilege
  const isAdmin = await UserController.isAdmin(mongoClient, payload.uid);
  if (!isAdmin) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION);
  }

  // Edit post
  const result = await fnEditPost(mongoClient, payload);
  if (result.updated === 'NOT_FOUND') {
    return new ApiFailedResponse(ApiResponseCode.FAILED_POST_NOT_EXISTS, {httpCode: 404});
  }

  return fnConstructResponse(payload, result);
};
