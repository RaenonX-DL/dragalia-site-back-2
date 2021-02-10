import {ResponseBase} from '../../base/response';
import {NotExistsResponse} from './response';

export const handleNotExists = (): ResponseBase => {
  return new NotExistsResponse();
};
