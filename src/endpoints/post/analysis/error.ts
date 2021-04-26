import {AnalysisType} from '../../../api-def/api';
import {CustomError} from '../../../base/error';

/**
 * Error to be thrown if the analysis type is unhandled.
 */
export class UnhandledAnalysisTypeError extends CustomError {
  /**
   * Construct an unhandled analysis type error.
   *
   * @param {number} seqId analysis sequential ID
   * @param {AnalysisType} analysisType analysis type
   */
  constructor(seqId: number, analysisType: AnalysisType) {
    super(`Type of the analysis #A${seqId} unhandled: ${analysisType}`);
  }
}
