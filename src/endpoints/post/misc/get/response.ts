import {
  MiscPostBody,
  MiscPostGetResponse as MiscPostGetResponseApi,
} from '../../../../api-def/api';
import {PostGetResponse, PostGetResponseParam} from '../../base/response/post/get';


export type MiscGetResponse = PostGetResponseParam & MiscPostBody;

/**
 * API response class for getting a misc post.
 */
export class MiscPostGetResponse extends PostGetResponse {
  body: MiscGetResponse;

  /**
   * Construct a misc post get API response.
   *
   * @param {QuestGetResponse} params params for constructing a misc post get response
   */
  constructor(params: MiscGetResponse) {
    super(params);

    this.body = params;
  }

  /**
   * @inheritDoc
   */
  toJson(): MiscPostGetResponseApi {
    return {
      ...super.toJson(),
      ...this.body,
    };
  }
}
