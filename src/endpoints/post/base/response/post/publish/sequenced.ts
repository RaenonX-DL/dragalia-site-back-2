import {
  PostPublishResult,
  SequencedPostPublishResponse as SequencedPostPublishResponseApi,
} from '../../../../../../api-def/api';
import {PostPublishResponse} from './common';


/**
 * API response class for a successful post publish.
 */
export abstract class SequencedPostPublishResponse extends PostPublishResponse {
  seqId: number;

  /**
   * Construct a successful post publishing API response.
   *
   * @param {number} seqId sequential ID of the newly published post
   * @param {PostPublishResult} result sequenced post publishing result
   */
  protected constructor(seqId: number, result: PostPublishResult) {
    super(result);

    this.seqId = seqId;
  }

  /**
   * @inheritDoc
   */
  toJson(): SequencedPostPublishResponseApi {
    return {
      ...super.toJson(),
      seqId: this.seqId,
    };
  }
}
