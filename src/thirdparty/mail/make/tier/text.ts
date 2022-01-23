import {SupportedLanguages} from '../../../../api-def/api';
import {MakeMailTierUpdatedOpts} from './type';


export const makeMailTierUpdatedText = ({
  lang, title, sitePath,
}: MakeMailTierUpdatedOpts): string => {
  if (lang === SupportedLanguages.EN) {
    return `The tier of ${title} has updated. Link: ${sitePath}.`;
  }

  return `${title} 的評級已更新。連結: ${sitePath}`;
};
