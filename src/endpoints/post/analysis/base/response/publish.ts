import {AnalysisPublishResponse as AnalysisPublishResponseApi} from '../../../../../api-def/api';
import {PostPublishResponse} from '../../../base/response/post/publish/common';

/**
 * API response class for an analysis publish.
 */
export abstract class AnalysisPublishResponse extends PostPublishResponse {
  unitId: number;

  /**
   * Construct an analysis publishing API response.
   *
   * @param {number} unitId unit ID of the published analysis
   */
  protected constructor(unitId: number) {
    super();

    this.unitId = unitId;
  }

  /**
   * @inheritDoc
   */
  toJson(): AnalysisPublishResponseApi {
    return {
      ...super.toJson(),
      unitId: this.unitId,
    };
  }
}
