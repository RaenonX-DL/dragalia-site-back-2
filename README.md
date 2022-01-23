# dragalia-site-back-2

[![back-time-badge]][back-time-link]

**CI**

|                 Main                 |                Dev                 |
|:------------------------------------:|:----------------------------------:|
| [![back-ci-main]][back-ci-main-link] | [![back-ci-dev]][back-ci-dev-link] |

**CD**

[![back-cd]][back-cd-link]

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

|                       Main                       |                      Dev                       |
|:------------------------------------------------:|:----------------------------------------------:|
|  [![back-grade-badge-main]][back-cq-link-main]   |  [![back-grade-badge-dev]][back-cq-link-dev]   |
| [![back-coverage-badge-main]][back-cq-link-main] | [![back-coverage-badge-dev]][back-cq-link-dev] |

The renewed backend of [Dragalia Lost info website by OM][back-site].

This one is using [fastify] (was [express.js][express]) while the previous one is using Flask.

## Environment Variables

|            Name             | Required/Optional | Description                                                                                                                                                       |
|:---------------------------:|:-----------------:|:------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|   `CORS_ALLOWED_ORIGINS`    |     Required      | Allowed origins separated by comma (`,`). For example: `https://dl.raenonx.cc,http://localhost:3000`. This is allow to be empty if `CI` is `true`.                |
|         `MONGO_URL`         |     Required      | Connection string of MongoDB database.                                                                                                                            |
|   `GA_CREDENTIAL_BASE64`    |     Required      | Google Analytics Data API OAuth client JSON credential in base64 string.                                                                                          |
|          `GA_DEV`           |     Optional      | Setting this to any truthy value will make any related queries return mock Google Analytics data instead of actually sending the request, reducing the API usage. |
|        `MAIL_SENDER`        |     Required      | Email address for logging into a SMTP server for email service.                                                                                                   |
|       `MAIL_PASSWORD`       |     Required      | Password for logging into a SMTP server for email service.                                                                                                        |
|      `MAIL_LINK_ROOT`       |     Required      | Link root to use in between email links. This should **NOT** end with a slash (`/`).                                                                              |
|   `NEW_RELIC_LICENSE_KEY`   |     Optional      | New Relic license key for measuring the app performance.                                                                                                          |
| `NEXT_PUBLIC_RESOURCE_ROOT` |     Required      | Root URL of the exported resources. This should **not** end with a slash (`/`).                                                                                   |
|  `NEXT_PUBLIC_DEPOT_ROOT`   |     Required      | Root URL of the data depot. This should **not** end with a slash (`/`).                                                                                           |
|  `NEXT_PUBLIC_AUDIO_ROOT`   |     Required      | Root URL of the audio depot. This should **not** end with a slash (`/`).                                                                                          |
|            `CI`             |     Optional      | Set this to `true` for CI-specific behavior.                                                                                                                      |
|           `PORT`            |     Optional      | Port to run the app. Defaults to `8787`.                                                                                                                          |

## Deployments

To make the application works properly,
the MongoDB instance **MUST** be deployed in the following configuration:

- Storage Engine: WiredTiger
- Cluster: Replica Set

[express]: https://expressjs.com/
[fastify]: https://www.fastify.io/

[back-repo]: https://github.com/RaenonX-DL/dragalia-site-back
[back-site]: https://dl.raenonx.cc
[back-ci-main]: https://dev.azure.com/RaenonX-DL/DL-Site/_apis/build/status/dragalia-site-back%20(Build)?branchName=main
[back-ci-main-link]: https://dev.azure.com/RaenonX-DL/DL-Site/_build/latest?definitionId=2&branchName=main
[back-ci-dev]: https://dev.azure.com/RaenonX-DL/DL-Site/_apis/build/status/dragalia-site-back%20(Build)?branchName=dev
[back-ci-dev-link]: https://dev.azure.com/RaenonX-DL/DL-Site/_build/latest?definitionId=2&branchName=dev
[back-cd]: https://vsrm.dev.azure.com/RaenonX-DL/_apis/public/Release/badge/0159375c-7a21-49a8-88d5-9af78c5f2150/7/7
[back-cd-link]: https://dev.azure.com/RaenonX-DL/DL-Site/_release?definitionId=7
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
