import React from 'react';

import {MailContent} from '../../type';
import {generateMailContent} from '../base/make';
import {MailContentTierUpdatedComponent} from './html';
import {makeMailTierUpdatedText} from './text';
import {makeMailTierUpdatedTitle} from './title';
import {MakeMailTierUpdatedOpts} from './type';


export const makeMailTierUpdated = (opts: MakeMailTierUpdatedOpts): MailContent => {
  return generateMailContent({
    ...opts,
    getSubject: makeMailTierUpdatedTitle,
    getText: makeMailTierUpdatedText,
    getHtml: (opts) => <MailContentTierUpdatedComponent {...opts}/>,
  });
};
