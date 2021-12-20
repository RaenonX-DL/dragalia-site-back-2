import {HandlerParams} from '../../endpoints/lookup';
import {NotExistsResponse} from './response';


export const handleMethodNotAllowed = (
  allowedMethods: Array<string>,
) => async (
  {response}: HandlerParams,
): Promise<NotExistsResponse> => {
  response.header('Access-Control-Allow-Methods', allowedMethods.join(', ').toUpperCase());

  return new NotExistsResponse();
};
