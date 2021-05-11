import {MongoClient} from 'mongodb';

import {PostGetPayload, ApiResponseCode, SupportedLanguages} from '../../../../api-def/api';
import {GoogleUserController} from '../../../userControl/controller';
import {GoogleUser} from '../../../userControl/model';
import {PostGetResult} from '../controller/get';
import {PostDocumentBase} from '../model';
import {ApiFailedResponse} from '../response/failed';
import {PostGetSuccessResponse} from '../response/post/get';

type FunctionGetPost<T extends PostDocumentBase, G extends PostGetResult<T>> = (
  mongoClient: MongoClient,
  seqId: number,
  lang: SupportedLanguages,
  incCount: boolean,
) => Promise<G | null>;

type FunctionConstructResponse<T extends PostDocumentBase,
  R extends PostGetSuccessResponse,
  G extends PostGetResult<T>> = (
  userData: GoogleUser | null, getResult: G,
) => R;

export const handleGetPost = async <T extends PostDocumentBase,
  R extends PostGetSuccessResponse,
  G extends PostGetResult<T>>(
  mongoClient: MongoClient,
  payload: PostGetPayload,
  fnGetPost: FunctionGetPost<T, G>,
  fnConstructResponse: FunctionConstructResponse<T, R, G>,
): Promise<ApiFailedResponse | R> => {
  // Get a post
  const getResult = await fnGetPost(
    mongoClient, payload.seqId, payload.lang, true,
  );
  if (!getResult) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_POST_NOT_EXISTS, {httpCode: 404});
  }

  // Get the data of the user who send this request
  const userData = await GoogleUserController.getUserData(mongoClient, payload.googleUid);

  return fnConstructResponse(userData, getResult);
};
