import {InternalErrorResponse} from './response';


export const handleInternalError = (error: Error) => async (): Promise<InternalErrorResponse> => {
  return new InternalErrorResponse(error);
};
