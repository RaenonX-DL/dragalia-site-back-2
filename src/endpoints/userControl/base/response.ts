import {ApiResponseCode, UserIsAdminResponse as UserIsAdminResponseApi} from '../../../api-def/api';
import {ApiResponse} from '../../../base/response';

/**
 * API response class for the endpoint to check if the user is an admin.
 *
 * The response code will be {@linkcode ApiResponseCode.SUCCESS} for existing user;
 * {@linkcode ApiResponseCode.SUCCESS_NEW} for newly registered user.
 */
export class UserIsAdminResponse extends ApiResponse {
  isAdmin: boolean;

  /**
   * Construct an user admin check API response.
   *
   * @param {boolean} isAdmin if the user is an admin
   * @param {ApiResponseCode} responseCode API response code
   */
  constructor(isAdmin: boolean, responseCode: ApiResponseCode = ApiResponseCode.SUCCESS) {
    super(responseCode);

    this.isAdmin = isAdmin;
  }

  /**
   * @inheritDoc
   */
  toJson(): UserIsAdminResponseApi {
    return {
      ...super.toJson(),
      isAdmin: this.isAdmin,
    };
  }
}
