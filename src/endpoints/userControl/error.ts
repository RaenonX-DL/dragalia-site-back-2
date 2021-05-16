import {CustomError} from '../../base/error';

/**
 * Error to be thrown if the user does not exist.
 */
export class UserNotExistsError extends CustomError {
  /**
   * Construct an user not exists error.
   *
   * @param {string} userId User ID in the request
   */
  constructor(userId: string) {
    super(`User ID ${userId} does not exist`);
  }
}


/**
 * Error to be thrown if the user ID is empty while required.
 */
export class UserIdEmptyError extends CustomError {
  /**
   * Construct an user ID empty error.
   */
  constructor() {
    super(`User ID should not be empty`);
  }
}
