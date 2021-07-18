# dragalia-site-back-2

[![back-deployment]][back-site]
[![back-ci]][back-ci-link]
[![back-time-badge]][back-time-link]

**Site Status**

[![back-site-status]][back-site]
[![back-site-response]][back-site]

[![back-site-day]][back-site]
[![back-site-week]][back-site]
[![back-site-month]][back-site]

> These refresh every 5 minutes.

**Code Quality**

[![back-lgtm-alert-badge]][back-lgtm-alert-link]
[![back-lgtm-quality-badge]][back-lgtm-quality-link]
[![back-lgtm-loc-badge]][back-lgtm-alert-link]

Main | Dev
:---: | :---:
[![back-grade-badge-main]][back-cq-link-main] | [![back-grade-badge-dev]][back-cq-link-dev]
[![back-coverage-badge-main]][back-cq-link-main] | [![back-coverage-badge-dev]][back-cq-link-dev]

The renewed backend of [Dragalia Lost info website by OM][back-site].

This one is using [fastify] (was [express.js][express]) while the previous one is using Flask.

## Environment Variables

Name | Required/Optional | Description
:---: | :---: | :---:
MONGO_URL | Required | Connection string of MongoDB database.
CI | Optional | Specify this to `true` for CI-specific behavior.

[express]: https://expressjs.com/
[fastify]: https://www.fastify.io/

[back-repo]: https://github.com/RaenonX-DL/dragalia-site-back
[back-deployment]: https://pyheroku-badge.herokuapp.com/?app=dragalia-site-back
[back-site]: https://dl.raenonx.cc
[back-ci]: https://github.com/RaenonX-DL/dragalia-site-back-2/workflows/CI%20%26%20CD/badge.svg
[back-ci-link]: https://github.com/RaenonX-DL/dragalia-site-back-2/actions/workflows/nodejs.yml
[back-time-badge]: https://wakatime.com/badge/github/RaenonX-DL/dragalia-site-back-2.svg
[back-time-link]: https://wakatime.com/badge/github/RaenonX-DL/dragalia-site-back-2
[back-site-status]: https://badgen.net/uptime-robot/status/m787223687-0bc3d1f09f7bf2b07ed95c85?cache=300
[back-site-response]: https://badgen.net/uptime-robot/response/m787223687-0bc3d1f09f7bf2b07ed95c85?cache=300
[back-site-day]: https://badgen.net/uptime-robot/day/m787223687-0bc3d1f09f7bf2b07ed95c85?label=uptime%20in%2024%20hrs&cache=300
[back-site-week]: https://badgen.net/uptime-robot/week/m787223687-0bc3d1f09f7bf2b07ed95c85?label=uptime%20in%207%20days&cache=300
[back-site-month]: https://badgen.net/uptime-robot/month/m787223687-0bc3d1f09f7bf2b07ed95c85?label=uptime%20in%201%20month&cache=300
[back-lgtm-alert-badge]: https://badgen.net/lgtm/alerts/g/RaenonX-DL/dragalia-site-back-2/javascript?icon=lgtm
[back-lgtm-alert-link]: https://lgtm.com/projects/g/RaenonX-DL/dragalia-site-back-2/alerts/
[back-lgtm-quality-badge]: https://badgen.net/lgtm/grade/g/RaenonX-DL/dragalia-site-back-2/javascript?icon=lgtm
[back-lgtm-quality-link]: https://lgtm.com/projects/g/RaenonX-DL/dragalia-site-back-2/context:javascript
[back-lgtm-loc-badge]: https://badgen.net/lgtm/lines/g/RaenonX-DL/dragalia-site-back-2/javascript?icon=lgtm
[back-cq-link-main]: https://www.codacy.com/gh/RaenonX-DL/dragalia-site-back-2/dashboard?branch=main
[back-cq-link-dev]: https://www.codacy.com/gh/RaenonX-DL/dragalia-site-back-2/dashboard?branch=dev
[back-grade-badge-main]: https://app.codacy.com/project/badge/Grade/a0849e3eb6704b29b1672f26c00ca763?branch=main
[back-grade-badge-dev]: https://app.codacy.com/project/badge/Grade/a0849e3eb6704b29b1672f26c00ca763?branch=dev
[back-coverage-badge-main]: https://app.codacy.com/project/badge/Coverage/a0849e3eb6704b29b1672f26c00ca763?branch=main
[back-coverage-badge-dev]: https://app.codacy.com/project/badge/Coverage/a0849e3eb6704b29b1672f26c00ca763?branch=dev
