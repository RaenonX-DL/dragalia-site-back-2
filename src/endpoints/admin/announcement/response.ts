import {
  ApiResponseCode,
  BaseResponse,
  EmailSendResult,
  SiteAnnouncementResponse as SiteAnnouncementResponseApi,
} from '../../../api-def/api';
import {ApiResponse} from '../../../base/response';


type SiteAnnouncementResponseOptions = Omit<SiteAnnouncementResponseApi, keyof BaseResponse>;

/**
 * API response class for the endpoint to send the website announcement.
 *
 * Using this response class indicates that the update succeeds.
 */
export class AdminSendAnnouncementResponse extends ApiResponse {
  result: EmailSendResult;

  /**
   * Construct a website announcement endpoint API response.
   *
   * @param {SiteAnnouncementResponseOptions} options options to construct the response
   */
  constructor({result}: SiteAnnouncementResponseOptions) {
    const responseCode = ApiResponseCode.SUCCESS;

    super(responseCode);

    this.result = result;
  }

  /**
   * @inheritDoc
   */
  toJson(): SiteAnnouncementResponseApi {
    return {
      ...super.toJson(),
      result: this.result,
    };
  }
}
