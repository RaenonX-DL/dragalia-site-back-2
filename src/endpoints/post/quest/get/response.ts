import {PositionalInfo, QuestPostGetSuccessResponse as QuestPostGetSuccessResponseApi} from '../../../../api-def/api';
import {PostGetSuccessResponse, PostGetSuccessResponseParam} from '../../base/response/post/get';

export type QuestPostGetSuccessResponseParam = PostGetSuccessResponseParam & {
  title: string,
  general: string,
  video: string,
  info: Array<PositionalInfo>,
  addendum: string,
}

/**
 * API response class for getting a single quest post.
 */
export class QuestPostGetSuccessResponse extends PostGetSuccessResponse {
  title: string;
  general: string;
  video: string;
  info: Array<PositionalInfo>;
  addendum: string;

  /**
   * Construct a successful single quest post get API response.
   *
   * @param {boolean} isAdmin if the user is an admin
   * @param {boolean} showAds if the user should have ads shown
   * @param {QuestPostGetSuccessResponseParam} params params for constructing a quest post get response
   */
  constructor(isAdmin: boolean, showAds: boolean, params: QuestPostGetSuccessResponseParam) {
    super(isAdmin, showAds, params);

    this.title = params.title;
    this.general = params.general;
    this.video = params.video;
    this.info = params.info;
    this.addendum = params.addendum;
  }

  /**
   * @inheritDoc
   */
  toJson(): QuestPostGetSuccessResponseApi {
    return {
      ...super.toJson(),
      title: this.title,
      general: this.general,
      video: this.video,
      info: this.info,
      addendum: this.addendum,
    };
  }
}
