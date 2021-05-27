import {MongoClient} from 'mongodb';

import {PostGetPayload, ApiResponseCode} from '../../../../api-def/api';
import {GoogleUserController} from '../../../userControl/controller';
import {GoogleUser} from '../../../userControl/model';
import {PostGetResult} from '../controller/get';
import {PostDocumentBaseNoTitle} from '../model';
import {ApiFailedResponse} from '../response/failed';
import {PostGetResponse} from '../response/post/get';

type FunctionGetPost<T extends PostDocumentBaseNoTitle,
  P extends PostGetPayload,
  G extends PostGetResult<T>> = (payload: P) => Promise<G | null>;

type FunctionConstructResponse<T extends PostDocumentBaseNoTitle,
  R extends PostGetResponse,
  G extends PostGetResult<T>> = (
  userData: GoogleUser | null, getResult: G,
) => R;

export const handleGetPost = async <T extends PostDocumentBaseNoTitle,
  P extends PostGetPayload,
  R extends PostGetResponse,
  G extends PostGetResult<T>>(
  mongoClient: MongoClient,
  payload: P,
  fnGetPost: FunctionGetPost<T, P, G>,
  fnConstructResponse: FunctionConstructResponse<T, R, G>,
): Promise<ApiFailedResponse | R> => {
  // Get a post
  const getResult = await fnGetPost(payload);
  if (!getResult) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_POST_NOT_EXISTS, {httpCode: 404});
  }

  // Get the data of the user who send this request
  const userData = await GoogleUserController.getUserData(mongoClient, payload.googleUid);

  return fnConstructResponse(userData, getResult);
};
