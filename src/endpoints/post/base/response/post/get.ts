import {
  BaseResponse,
  PostGetSuccessResponse as PostGetSuccessResponseApi,
  PostModifyNote,
} from '../../../../../api-def/api';
import {ApiResponseCode} from '../../../../../api-def/api/responseCode';
import {ApiResponse} from '../../../../../base/response';


export type PostGetSuccessResponseParam = Omit<PostGetSuccessResponseApi, keyof BaseResponse | 'isAdmin' | 'showAds'>;


/**
 * API response class for a successful post getting.
 *
 * Note that the post view count in this response does **not** count in this request.
 * The view count will be updated in the database,
 * but not included in the view count calculation of this get response.
 */
export abstract class PostGetSuccessResponse extends ApiResponse {
  isAdmin: boolean;
  showAds: boolean;

  seqId: number;
  lang: string;
  modified: Date;
  published: Date;
  modifyNotes: Array<PostModifyNote>;
  viewCount: number;
  isAltLang: boolean;
  otherLangs: Array<string>;

  /**
   * Construct a successful post getting API response.
   *
   * @param {boolean} isAdmin if the user is an admin
   * @param {boolean} showAds if the user should have ads shown
   * @param {PostGetSuccessResponseParam} params parameters for constructing a successful post getting response
   * @protected
   */
  protected constructor(isAdmin: boolean, showAds: boolean, params: PostGetSuccessResponseParam) {
    super(ApiResponseCode.SUCCESS);

    this.isAdmin = isAdmin;
    this.showAds = showAds;

    this.seqId = Number(params.seqId);
    this.lang = params.lang;
    this.modified = params.modified;
    this.published = params.published;
    this.modifyNotes = params.modifyNotes;
    this.viewCount = params.viewCount;
    this.isAltLang = params.isAltLang;
    this.otherLangs = params.otherLangs;
  }

  /**
   * @inheritDoc
   */
  toJson(): PostGetSuccessResponseApi {
    return {
      ...super.toJson(),
      isAdmin: this.isAdmin,
      showAds: this.showAds,
      seqId: this.seqId,
      lang: this.lang,
      modified: this.modified,
      published: this.published,
      modifyNotes: this.modifyNotes,
      viewCount: this.viewCount,
      isAltLang: this.isAltLang,
      otherLangs: this.otherLangs,
    };
  }
}
