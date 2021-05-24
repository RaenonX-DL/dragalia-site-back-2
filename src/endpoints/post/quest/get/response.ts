import {
  QuestPostBody,
  QuestPostGetResponse as QuestPostGetResponseApi,
} from '../../../../api-def/api';
import {PostGetResponse, PostGetResponseParam} from '../../base/response/post/get';

export type QuestGetResponse = PostGetResponseParam & QuestPostBody

/**
 * API response class for getting a quest post.
 */
export class QuestPostGetResponse extends PostGetResponse {
  body: QuestGetResponse;

  /**
   * Construct a quest post get API response.
   *
   * @param {boolean} isAdmin if the user is an admin
   * @param {QuestGetResponse} params params for constructing a quest post get response
   */
  constructor(isAdmin: boolean, params: QuestGetResponse) {
    super(isAdmin, params);

    this.body = params;
  }

  /**
   * @inheritDoc
   */
  toJson(): QuestPostGetResponseApi {
    return {
      ...super.toJson(),
      ...this.body,
    };
  }
}
