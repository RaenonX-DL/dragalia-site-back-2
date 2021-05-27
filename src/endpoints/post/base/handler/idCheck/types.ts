import {PostIdCheckPayload} from '../../../../../api-def/api';
import {PostIdCheckResponse} from '../../response/post/idCheck';

export type FunctionCheckIdAvailability<P extends PostIdCheckPayload> = (payload: P) => Promise<boolean>;

export type FunctionConstructResponse<R extends PostIdCheckResponse> = (
  isAdmin: boolean, isAvailable: boolean,
) => R;
