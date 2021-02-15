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
