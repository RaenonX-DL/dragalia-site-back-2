import {generateResponse} from '../../utils';
import {DataPageMetaResponse} from '../response';
import {DataMetaHandler} from '../type';


export const datamineHandler: DataMetaHandler = async ({mongoClient, payload, user}) => {
  return await generateResponse(
    payload,
    mongoClient,
    user,
    (options) => new DataPageMetaResponse({...options, params: {versionCode: payload.id}}),
  );
};
