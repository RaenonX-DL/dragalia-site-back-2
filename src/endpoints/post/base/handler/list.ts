import {MongoClient} from 'mongodb';

import {SequencedPostListPayload, SequencedPostInfo, SupportedLanguages} from '../../../../api-def/api';
import {UserController} from '../../../userControl/controller';
import {User} from '../../../userControl/model';
import {PostListResult} from '../controller/list';
import {PostListResponse} from '../response/post/list';


type FunctionGetPostList<E extends SequencedPostInfo> = (
  mongoClient: MongoClient,
  lang: SupportedLanguages,
) => Promise<PostListResult<E>>;

type FunctionConstructResponse<R extends PostListResponse> = (
  userData: User | null, postUnits: Array<SequencedPostInfo>
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
  const {postListEntries} = await fnGetPostList(mongoClient, payload.lang);

  // Get the data of the user who send this request
  const userData = await UserController.getUserData(mongoClient, payload.uid);

  return fnConstructResponse(userData, postListEntries);
};
