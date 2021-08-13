import {CustomError} from '../../../base/error';


/**
 * Error to be thrown if there are multiple units sharing the same name.
 */
export class DuplicatedNamesError extends CustomError {
  /**
   * Construct a duplicated names error.
   *
   * @param {string} msg other error message to be displayed to help debugging
   */
  constructor(msg: string) {
    super(`There are duplicated unit names: ${msg}`);
  }
}
