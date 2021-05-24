import {AnalysisPublishResponse} from '../../base/response/publish';


/**
 * API response class for the successful dragon analysis publish.
 */
export class DragonAnalysisPublishedResponse extends AnalysisPublishResponse {
  /**
   * @inheritDoc
   */
  constructor(seqId: number) {
    super(seqId);
  }
}
