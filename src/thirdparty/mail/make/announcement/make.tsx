import React from 'react';

import {MailContent} from '../../type';
import {generateMailContent} from '../base/make';
import {MailContentSiteAnnouncementComponent} from './html';
import {makeMailSiteAnnouncementText} from './text';
import {makeMailSiteAnnouncementTitle} from './title';
import {MakeMailSiteAnnouncementOpts} from './type';


export const makeMailSiteAnnouncement = (opts: MakeMailSiteAnnouncementOpts): MailContent => {
  return generateMailContent({
    ...opts,
    getSubject: makeMailSiteAnnouncementTitle,
    getText: makeMailSiteAnnouncementText,
    getHtml: (opts) => <MailContentSiteAnnouncementComponent {...opts}/>,
  });
};
