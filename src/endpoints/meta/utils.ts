import {MongoClient} from 'mongodb';

import {BaseResponse, PageMetaPayload, PageMetaResponse} from '../../api-def/api';
import {User} from '../userControl/model';
import {AlertController} from './alert/controller';
import {GenericPageMetaResponse} from './general/response';


type SharedResponseOptions = Omit<PageMetaResponse, 'params' | keyof BaseResponse>

export const generateResponse = async <P extends PageMetaPayload, T extends GenericPageMetaResponse>(
  payload: P,
  mongoClient: MongoClient,
  userData: User | null,
  generateResponseFn: (options: SharedResponseOptions) => T,
): Promise<T> => {
  const alerts = await AlertController.getSiteAlerts(mongoClient, payload.lang);

  if (!userData) {
    return generateResponseFn({
      isAdmin: false,
      showAds: true,
      alerts,
    });
  }

  return generateResponseFn({
    isAdmin: userData.isAdmin,
    showAds: !userData.isAdsFree,
    alerts,
  });
};
