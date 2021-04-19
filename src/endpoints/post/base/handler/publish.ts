import {MongoClient, MongoError} from 'mongodb';

import {ApiResponseCode, PostMetaPayload} from '../../../../api-def/api';
import {SeqIdSkippingError} from '../../error';
import {ApiFailedResponse} from '../response/failed';
import {PostPublishSuccessResponse} from '../response/post/publish';

type FunctionPublishPost<P extends PostMetaPayload> = (mongoClient: MongoClient, payload: P) => Promise<number>;

type FunctionConstructResponse<R extends PostPublishSuccessResponse> = (
  seqId: number,
) => R;

export const handlePublishPost = async <P extends PostMetaPayload, R extends PostPublishSuccessResponse>(
  mongoClient: MongoClient, payload: P,
  fnPublishPost: FunctionPublishPost<P>, fnConstructResponse: FunctionConstructResponse<R>,
): Promise<R | ApiFailedResponse> => {
  // Publish the post
  let newSeqId;
  try {
    newSeqId = await fnPublishPost(mongoClient, payload);
  } catch (e) {
    // https://stackoverflow.com/a/1433608/11571888
    if (e instanceof SeqIdSkippingError) {
      return new ApiFailedResponse(ApiResponseCode.FAILED_POST_NOT_PUBLISHED_ID_SKIPPED);
    } else if (e instanceof MongoError && e.code === 11000) {
      // E11000 for duplicated key
      return new ApiFailedResponse(ApiResponseCode.FAILED_POST_ALREADY_EXISTS);
    } else {
      throw e; // let other kind of error bubble up
    }
  }

  return fnConstructResponse(newSeqId);
};
