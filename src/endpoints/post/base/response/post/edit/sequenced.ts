import {
  BaseResponse,
  SequencedPostEditResponse as SequencedPostEditResponseApi,
} from '../../../../../../api-def/api';
import {PostEditResponse} from './common';


export type SequencedPostEditResponseParams = Omit<SequencedPostEditResponseApi, keyof BaseResponse>;

/**
 * API response class for a sequenced post edit.
 */
export abstract class SequencedPostEditResponse extends PostEditResponse {
  seqId: number;

  /**
   * Construct a successful post editing API response.
   *
   * @param {SequencedPostEditResponseParams} params parameters to construct a sequenced post editing response
   * @protected
   */
  constructor(params: SequencedPostEditResponseParams) {
    super();

    this.seqId = +params.seqId;
  }

  /**
   * @inheritDoc
   */
  toJson(): SequencedPostEditResponseApi {
    return {
      ...super.toJson(),
      seqId: this.seqId,
    };
  }
}
