import {ApiResponseCode} from '../../../../api-def/api';
import {ApiFailedResponse} from '../../../post/base/response/failed';
import {KeyPointController} from '../../../tier/points/controller';
import {generateResponse} from '../../utils';
import {DataPageMetaResponse} from '../response';
import {DataMetaHandler} from '../type';


export const tierKeyPointHandler: DataMetaHandler = async ({mongoClient, payload, user}) => {
  const title = await KeyPointController.getDescription(mongoClient, payload.lang, payload.id);

  if (!title) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_DATA_NOT_EXISTS);
  }

  return await generateResponse(
    payload,
    mongoClient,
    user,
    (options) => new DataPageMetaResponse({...options, params: {title}}),
  );
};
