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
