import {CustomError} from '../base/error';

/**
 * Error to be thrown if the payload key is deprecated.
 */
export class PayloadKeyDeprecatedError extends CustomError {
  /**
   * Construct an error indicating that the payload key is deprecated.
   *
   * @param {string} key payload key that is deprecated
   */
  constructor(key: string) {
    super(`Payload key ${key} is deprecated.`);
  }
}
