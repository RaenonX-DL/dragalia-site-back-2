import {ResponseBase} from '../../base/response';
import {RootResponse} from './response';

export const handleRoot = (): ResponseBase => {
  return new RootResponse();
};
