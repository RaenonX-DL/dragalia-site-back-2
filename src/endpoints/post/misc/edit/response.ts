import {SequencedPostEditResponse} from '../../base/response/post/edit/sequenced';


/**
 * API response class for editing a misc post.
 */
export class MiscPostEditResponse extends SequencedPostEditResponse {
  /**
   * Construct a misc post edit API response.
   *
   * @param {number} seqId sequential ID of the edited post
   */
  constructor(seqId: number) {
    super({seqId});
  }
}
