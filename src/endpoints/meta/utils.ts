import {User} from '../userControl/model';
import {GenericPageMetaResponse} from './general/response';

type SharedResponseOptions = {
  isAdmin: boolean,
  showAds: boolean,
};

export const generateResponse = <T extends GenericPageMetaResponse>(
  userData: User | null,
  generateResponseFn: (options: SharedResponseOptions) => T,
): T => {
  if (!userData) {
    return generateResponseFn({
      isAdmin: false,
      showAds: true,
    });
  }

  return generateResponseFn({
    isAdmin: userData.isAdmin,
    showAds: !userData.isAdsFree,
  });
};
