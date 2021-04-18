import {PostEditSuccessResponse} from '../../base/response/post/edit';

/**
 * API response class for editing a quest post.
 */
export class QuestPostEditSuccessResponse extends PostEditSuccessResponse {
  /**
   * Construct a successful single quest post edit API response.
   *
   * @param {number} seqId sequential ID of the edited post
   */
  constructor(seqId: number) {
    super({seqId});
  }
}
