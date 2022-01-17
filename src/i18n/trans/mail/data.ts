import {SupportedLanguages} from '../../../api-def/api';
import {I18nDataStruct} from './definition';


export const I18nData: I18nDataStruct = {
  mail: {
    title: {
      [SupportedLanguages.CHT]: '龍絆攻略站 by OM',
      [SupportedLanguages.EN]: 'Dragalia Lost Info Site by OM',
      [SupportedLanguages.JP]: 'ドラガリ攻略サイト by OM',
    },
    manageSubscription: {
      [SupportedLanguages.CHT]: '點選連結以管理通知: ',
      [SupportedLanguages.EN]: 'Click the link to manage the email subscription settings: ',
      [SupportedLanguages.JP]: 'URLをクリックするとメール受信を管理する: ',
    },
  },
};
