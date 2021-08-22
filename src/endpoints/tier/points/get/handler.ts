import {ObjectId} from 'mongodb';

import {KeyPointGetPayload} from '../../../../api-def/api';
import {processPayloadBase} from '../../../../utils/payload/base';
import {HandlerParams} from '../../../lookup';
import {KeyPointController} from '../controller';
import {KeyPointEntry} from '../model';
import {KeyPointGetResponse} from './response';


export const handleTierPointsGet = async ({
  payload,
  mongoClient,
}: HandlerParams<KeyPointGetPayload>): Promise<KeyPointGetResponse> => {
  payload = processPayloadBase(payload);

  const data = Object.fromEntries((await KeyPointController.getAllEntries(mongoClient))
    .map((entry) => {
      const model = KeyPointEntry.fromDocument(entry);

      return [
        (model.id as ObjectId).toString(), // Document (`entry`) must have `_id`
        {type: model.type, description: model.getDescription(payload.lang)},
      ];
    }));

  return new KeyPointGetResponse({data});
};
