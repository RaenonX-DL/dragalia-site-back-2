import {
  QuestPostGetContent,
  QuestPostGetSuccessResponse as QuestPostGetSuccessResponseApi,
} from '../../../../api-def/api';
import {PostGetSuccessResponse, PostGetSuccessResponseParam} from '../../base/response/post/get';

export type QuestGetResponse = PostGetSuccessResponseParam & QuestPostGetContent

/**
 * API response class for getting a quest post.
 */
export class QuestPostGetSuccessResponse extends PostGetSuccessResponse {
  body: QuestGetResponse;

  /**
   * Construct a successful single quest post get API response.
   *
   * @param {boolean} isAdmin if the user is an admin
   * @param {boolean} showAds if the user should have ads shown
   * @param {QuestGetResponse} params params for constructing a quest post get response
   */
  constructor(isAdmin: boolean, showAds: boolean, params: QuestGetResponse) {
    super(isAdmin, showAds, params);

    this.body = params;
  }

  /**
   * @inheritDoc
   */
  toJson(): QuestPostGetSuccessResponseApi {
    return {
      ...super.toJson(),
      ...this.body,
    };
  }
}
