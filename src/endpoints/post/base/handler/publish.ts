import {MongoClient, MongoError} from 'mongodb';

import {ApiResponseCode, RequestPayloadBase} from '../../../../api-def/api';
import {UnitNotExistsError, UnitTypeMismatchError} from '../../analysis/error';
import {SeqIdSkippingError} from '../../error';
import {ApiFailedResponse} from '../response/failed';
import {PostPublishResponse} from '../response/post/publish/common';

type FunctionPublishPost<P extends RequestPayloadBase> = (mongoClient: MongoClient, payload: P) => Promise<number>;

type FunctionConstructResponse<R extends PostPublishResponse> = (
  seqId: number,
) => R;

export const handlePublishPost = async <P extends RequestPayloadBase, R extends PostPublishResponse>(
  mongoClient: MongoClient,
  payload: P,
  fnPublishPost: FunctionPublishPost<P>,
  fnConstructResponse: FunctionConstructResponse<R>,
): Promise<R | ApiFailedResponse> => {
  // Publish the post
  let newSeqId;
  try {
    newSeqId = await fnPublishPost(mongoClient, payload);
  } catch (e) {
    // Handling specific error: https://stackoverflow.com/a/1433608/11571888
    if (e instanceof SeqIdSkippingError) {
      return new ApiFailedResponse(ApiResponseCode.FAILED_POST_NOT_PUBLISHED_ID_SKIPPED);
    } else if (e instanceof UnitNotExistsError) {
      return new ApiFailedResponse(ApiResponseCode.FAILED_UNIT_NOT_EXISTS);
    } else if (e instanceof UnitTypeMismatchError) {
      return new ApiFailedResponse(ApiResponseCode.FAILED_WRONG_ANALYSIS_TYPE);
    } else if (e instanceof MongoError && e.code === 11000) {
      // E11000 for duplicated key
      return new ApiFailedResponse(ApiResponseCode.FAILED_POST_ALREADY_EXISTS);
    } else {
      throw e; // let other kind of error bubble up
    }
  }

  return fnConstructResponse(newSeqId);
};
