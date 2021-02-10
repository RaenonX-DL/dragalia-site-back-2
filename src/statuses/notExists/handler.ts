import {NotExistsResponse} from './response';

export const handleNotExists = async (): Promise<NotExistsResponse> => {
  return new NotExistsResponse();
};
