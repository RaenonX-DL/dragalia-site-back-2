/**
 * Base error class of any custom errors.
 */
export abstract class CustomError extends Error {
  /**
   * Construct a custom error class.
   *
   * @param {string} message error message
   * @protected
   */
  protected constructor(message: string) {
    super(message);

    // https://stackoverflow.com/q/41102060/11571888
    Object.setPrototypeOf(this, new.target.prototype);

    // https://stackoverflow.com/a/32750746/11571888
    this.name = this.constructor.name;
  }
}

/**
 * Error to be thrown if the method should be implemented.
 *
 * Note that before using this, check if there is any ways that could fail the static analysis.
 * This way should be less preferred because the error is only thrown during the runtime.
 */
export class NotImplementedError extends CustomError {
  /**
   * Construct a not implemented error.
   *
   * @param {string} message error message
   */
  constructor(message?: string) {
    super(message || '');
  }
}
