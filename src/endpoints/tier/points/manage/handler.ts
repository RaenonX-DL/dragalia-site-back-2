import {ObjectId} from 'mongodb';

import {KeyPointManagePayload} from '../../../../api-def/api';
import {processPayloadBase} from '../../../../utils/payload/base';
import {HandlerParams} from '../../../lookup';
import {KeyPointController} from '../controller';
import {KeyPointEntry} from '../model';
import {KeyPointManageResponse} from './response';


export const handleTierPointsManage = async ({
  payload,
  mongoClient,
}: HandlerParams<KeyPointManagePayload>): Promise<KeyPointManageResponse> => {
  payload = processPayloadBase(payload);

  const points = (await KeyPointController.getAllEntries(mongoClient))
    .map((entry) => {
      const model = KeyPointEntry.fromDocument(entry);

      return {
        id: (model.id as ObjectId).toString(), // Document (`entry`) must have `_id`
        type: model.type,
        description: model.getDescription(payload.lang),
      };
    });

  return new KeyPointManageResponse({points});
};
