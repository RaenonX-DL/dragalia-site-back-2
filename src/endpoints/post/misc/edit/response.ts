import {PostEditResult} from '../../../../api-def/api';
import {SequencedPostEditResponse} from '../../base/response/post/edit/sequenced';


/**
 * API response class for editing a misc post.
 */
export class MiscPostEditResponse extends SequencedPostEditResponse {
  /**
   * @inheritDoc
   */
  constructor(seqId: number, result: PostEditResult) {
    super({seqId, ...result});
  }
}
