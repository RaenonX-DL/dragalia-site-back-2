import {SequencedPostEditResponse} from '../../base/response/post/edit/sequenced';

/**
 * API response class for editing a quest post.
 */
export class QuestPostEditResponse extends SequencedPostEditResponse {
  /**
   * Construct a quest post edit API response.
   *
   * @param {number} seqId sequential ID of the edited post
   */
  constructor(seqId: number) {
    super({seqId});
  }
}
