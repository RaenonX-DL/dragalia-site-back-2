import {BaseResponse, UnitPageMetaResponse as UnitPageMetaResponseApi} from '../../../api-def/api';
import {GenericPageMetaResponse} from '../general/response';


type UnitMetaResponseOptions = Omit<UnitPageMetaResponseApi, keyof BaseResponse>;

/**
 * API response class for the unit meta endpoint.
 */
export class UnitPageMetaResponse extends GenericPageMetaResponse {
  /**
   * Construct a unit meta endpoint API response.
   *
   * @param {UnitMetaResponseOptions} options options to construct a unit meta response
   */
  constructor(options: UnitMetaResponseOptions) {
    super(options);
  }
}
