import {UnitType} from '../../../api-def/api';
import {CustomError} from '../../../base/error';

/**
 * Error to be thrown if the analysis type is unhandled.
 */
export class UnhandledUnitTypeError extends CustomError {
  /**
   * Construct an unhandled analysis type error.
   *
   * @param {number} unitId analysis unit ID
   * @param {UnitType} unitType analysis type
   */
  constructor(unitId: number, unitType: UnitType) {
    super(`Type of the analysis for unit ID #${unitId} unhandled: ${unitType}`);
  }
}

/**
 * Error to be thrown if the unit does not exist.
 */
export class UnitNotExistsError extends CustomError {
  /**
   * Construct an unit not exists error.
   *
   * @param {number} unitId non-existent unit ID
   */
  constructor(unitId: number) {
    super(`Unit of ID ${unitId} does not exist`);
  }
}

/**
 * Error to be thrown if the unit type does not match.
 */
export class UnitTypeMismatchError extends CustomError {
  /**
   * Construct an unit type mismatch error.
   *
   * @param {number} unitId unit ID that causes the error
   * @param {UnitType} expectedType expected unit type
   * @param {UnitType} actualType actual unit type
   */
  constructor(unitId: number, expectedType: UnitType, actualType: UnitType) {
    super(`Unit of ID ${unitId} does not match the expected type (expected: ${expectedType} / actual: ${actualType})`);
  }
}
