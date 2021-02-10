import {RootResponse} from './response';

export const handleRoot = async (): Promise<RootResponse> => {
  return new RootResponse();
};
