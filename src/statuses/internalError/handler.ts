import {ResponseBase} from '../../base/response';
import {InternalErrorResponse} from './response';

export const handleInternalError = (error: Error) => (): ResponseBase => {
  return new InternalErrorResponse(error);
};
