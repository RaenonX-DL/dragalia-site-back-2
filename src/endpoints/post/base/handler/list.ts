import {MongoClient} from 'mongodb';

import {SequencedPostListPayload, SequencedPostInfo, SupportedLanguages} from '../../../../api-def/api';
import {GoogleUserController} from '../../../userControl/controller';
import {GoogleUser} from '../../../userControl/model';
import {PostListResult} from '../controller/list';
import {PostListResponse} from '../response/post/list';

type FunctionGetPostList<E extends SequencedPostInfo> = (
  mongoClient: MongoClient,
  lang: SupportedLanguages,
  start: number,
  limit: number,
) => Promise<PostListResult<E>>;

type FunctionConstructResponse<R extends PostListResponse> = (
  userData: GoogleUser | null, postUnits: Array<SequencedPostInfo>, startIdx: number, availableCount: number,
) => R;

export const handleListPost = async <P extends SequencedPostListPayload,
  R extends PostListResponse,
  E extends SequencedPostInfo>(
  mongoClient: MongoClient,
  payload: P,
  fnGetPostList: FunctionGetPostList<E>,
  fnConstructResponse: FunctionConstructResponse<R>,
): Promise<R> => {
  // Get a list of posts
  const {postListEntries, totalAvailableCount} = await fnGetPostList(
    mongoClient, payload.lang, payload.start, payload.limit,
  );

  // Get the data of the user who send this request
  const userData = await GoogleUserController.getUserData(mongoClient, payload.googleUid);

  return fnConstructResponse(userData, postListEntries, payload.start, totalAvailableCount);
};
