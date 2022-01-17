import {SupportedLanguages} from '../../../../api-def/api';
import {MakeMailTierUpdatedOpts} from './type';


export const makeMailTierUpdatedTitle = ({
  lang, title,
}: MakeMailTierUpdatedOpts): string => {
  if (lang === SupportedLanguages.EN) {
    return `Tier Updated - ${title}`;
  }

  return `【評級更新】${title}`;
};
