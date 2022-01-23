import React from 'react';

import {SupportedLanguages} from '../../../../api-def/api';
import {makeLink} from '../base/link';
import {MakeMailTierUpdatedHtmlOpts} from './type';


export const MailContentTierUpdatedComponent: React.FunctionComponent<MakeMailTierUpdatedHtmlOpts> = ({
  lang, title, sitePath,
}) => {
  const link = makeLink(sitePath);

  if (lang === SupportedLanguages.EN) {
    return (
      <>
        <p>The tier of <a href={link}>{title}</a> has been updated.</p>
      </>
    );
  }

  return (
    <>
      <p><a href={link}>{title}</a> 的評級已更新。</p>
    </>
  );
};
