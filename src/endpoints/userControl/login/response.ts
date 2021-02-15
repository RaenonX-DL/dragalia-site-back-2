import {ApiResponseCode} from '../../../api-def/api';
import {ApiResponse} from '../../../base/response';

/**
 * API response class for the user login endpoint.
 *
 * The response does not contain anything.
 *
 * The response code will be {@linkcode ApiResponseCode.SUCCESS} for existing user;
 * {@linkcode ApiResponseCode.SUCCESS_NEW} for newly registered user.
 */
export class UserLoginResponse extends ApiResponse {
  /**
   * Construct a root endpoint API response.
   *
   * @param {boolean} isNew if the logged in user is newly registered or not
   */
  constructor(isNew: boolean) {
    super(isNew ? ApiResponseCode.SUCCESS_NEW : ApiResponseCode.SUCCESS);
  }
}
