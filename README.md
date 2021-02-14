# dragalia-site-back-2

[![back-deployment]][back-site]
[![back-site-status]][back-site]
[![back-ci]][back-ci-link]
[![back-cq-badge]][back-cq-link]
[![back-coverage-badge]][back-cq-link]
[![back-lgtm-alert-badge]][back-lgtm-alert-link]
[![back-lgtm-quality-badge]][back-lgtm-quality-link]
[![back-time-badge]][back-time-link]

The renewed backend of [Dragalia Lost info website by OM][site].

This one is using [express.js][express] while the previous one is using Flask.

## Environment Variables

Name | Required/Optional | Description
:---: | :---: | :---:
MONGO_URL | Required | Connection string of MongoDB database.
CI | Optional | Specify this to `true` for CI-specific behavior.

[site]: https://dl.raenonx.cc

[express]: https://expressjs.com/

[back-deployment]: https://pyheroku-badge.herokuapp.com/?app=dragalia-site-back&style=flat-square

[back-site]: https://dl-back.raenonx.cc

[back-site-status]: https://img.shields.io/website?down_message=offline&up_message=online&url=https%3A%2F%2Fdl-back.raenonx.cc

[back-cq-link]: https://www.codacy.com/gh/RaenonX-DL/dragalia-site-back-2/dashboard

[back-cq-badge]: https://app.codacy.com/project/badge/Grade/a0849e3eb6704b29b1672f26c00ca763

[back-coverage-badge]: https://app.codacy.com/project/badge/Coverage/a0849e3eb6704b29b1672f26c00ca763

[back-ci]: https://github.com/RaenonX-DL/dragalia-site-back-2/workflows/Node%20CI/badge.svg

[back-ci-link]: https://github.com/RaenonX-DL/dragalia-site-back-2/actions?query=workflow%3A%22Node+CI%22

[back-time-link]: https://wakatime.com/badge/github/RaenonX-DL/dragalia-site-back-2

[back-time-badge]: https://wakatime.com/badge/github/RaenonX-DL/dragalia-site-back-2.svg

[back-lgtm-alert-badge]: https://img.shields.io/lgtm/alerts/g/RaenonX-DL/dragalia-site-back-2.svg?logo=lgtm&logoWidth=18

[back-lgtm-alert-link]: https://lgtm.com/projects/g/RaenonX-DL/dragalia-site-back-2/alerts/

[back-lgtm-quality-badge]: https://img.shields.io/lgtm/grade/javascript/g/RaenonX-DL/dragalia-site-back-2.svg?logo=lgtm&logoWidth=18

[back-lgtm-quality-link]: https://lgtm.com/projects/g/RaenonX-DL/dragalia-site-back-2/context:javascript
