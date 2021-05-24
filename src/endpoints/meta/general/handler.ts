import {PageMetaPayload} from '../../../api-def/api';
import {processPageMetaPayload} from '../../../utils/payload';
import {HandlerParams} from '../../lookup';
import {GoogleUserController} from '../../userControl/controller';
import {generateResponse} from '../utils';
import {GenericPageMetaResponse} from './response';

export const handleGeneralMeta = async ({
  payload,
  mongoClient,
}: HandlerParams<PageMetaPayload>): Promise<GenericPageMetaResponse> => {
  payload = processPageMetaPayload(payload);

  const userData = await GoogleUserController.getUserData(mongoClient, payload.googleUid);

  return generateResponse(
    userData,
    (options) => new GenericPageMetaResponse({
      ...options,
      params: {},
    }),
  );
};
