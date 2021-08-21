import {MongoClient} from 'mongodb';

import {PostGetPayload, ApiResponseCode} from '../../../../api-def/api';
import {PostGetResult} from '../controller/get';
import {PostDocumentBaseNoTitle} from '../model';
import {ApiFailedResponse} from '../response/failed';
import {PostGetResponse} from '../response/post/get';


type FunctionGetPost<
  T extends PostDocumentBaseNoTitle,
  P extends PostGetPayload,
  G extends PostGetResult<T>
> = (payload: P) => Promise<G | null>;

type FunctionConstructResponse<
  T extends PostDocumentBaseNoTitle,
  R extends PostGetResponse,
  G extends PostGetResult<T>
> = (
  getResult: G,
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

  return fnConstructResponse(getResult);
};
