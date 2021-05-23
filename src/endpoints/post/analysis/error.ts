import {UnitType} from '../../../api-def/api';
import {CustomError} from '../../../base/error';

/**
 * Error to be thrown if the analysis type is unhandled.
 */
export class UnhandledUnitTypeError extends CustomError {
  /**
   * Construct an unhandled analysis type error.
   *
   * @param {number} seqId analysis sequential ID
   * @param {UnitType} UnitType analysis type
   */
  constructor(seqId: number, UnitType: UnitType) {
    super(`Type of the analysis #A${seqId} unhandled: ${UnitType}`);
  }
}
