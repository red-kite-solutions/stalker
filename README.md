# STALKER | Recon Automation

Contains three modules:

Flow Manager: A NestJS TypeScript API that creates jobs, accepts job results and creates new jobs based on output and adds them to the Jobs Queue Handler

Jobs Queue Handler: A python flask API that is a priority queue in which you can add and remove jobs. Jobs are ordered with an explicit priority and on a FIFO basis

Worker (Jobs Handler): A python script that fetches jobs from the Jobs Queue Handler and executes them and gives the output to the Flow Manager. Many Jobs Handler can exist at the time

## Environment Variables

Some variables are needed by the applications to work properly. The variables are here described as how they are needed by the application, and not necessarily how they are set by the dockerfiles' entrypoint script as well as by the docker-compose. The environement variables that are considered secrets are set in the application by the entrypoint script to avoid having them written in the docker-compose or dockerfiles. They need to be set as secret files to be used with the dockerfiles and docker-compose.

#### Jobs Queue

| Environement variable | Example value           | Description                          | Is a secret |
| --------------------- | ----------------------- | ------------------------------------ | ----------- |
| JQH_API_KEY           | SuperRandomSecretAPIKey | The API key for the Jobs Queue       | Yes         |
| FLASK_APP             | jobs_queue_handler      | The name of flask's main python file | No          |

#### Worker (jobs handler)

The workers also use a configuration file to handle other variables. It is detailed in the config files section.

| Environement variable | Example value            | Description                                       | Is a secret |
| --------------------- | ------------------------ | ------------------------------------------------- | ----------- |
| JQH_API_KEY           | SuperRandomSecretAPIKey  | The API key for the Jobs Queue                    | Yes         |
| FM_API_KEY            | SuperRandomSecretAPIKey2 | Flow Manager's API key for workers to report data | Yes         |

#### Flow Manager

| Environement variable | Example value                 | Description                                       | Is a secret |
| --------------------- | ----------------------------- | ------------------------------------------------- | ----------- |
| JQH_API_KEY           | SuperRandomSecretAPIKey       | The API key for the Jobs Queue                    | Yes         |
| JQH_ADDRESS           | http://jqh:5000               | The address of the job queue                      | No          |
| FM_API_KEY            | SuperRandomSecretAPIKey2      | Flow Manager's API key for workers to report data | Yes         |
| MONGO_ADDRESS         | mongodb://mongo:27017/stalker | The address of the mongodb database               | No          |
| FM_JWT_SECRET         | SuperRandomSecretJWTKey       | The secret to sign JWT for users                  | Yes         |
| FM_REFRESH_SECRET     | SuperRandomSecretRefreshKey   | The secret to sign JWT refresh token for users    | Yes         |

## Secrets files

The secrets files are a way to provide environement variables inside the docker containers. To use the dockerfiles and the docker-compose, they must be set in a "secrets" folder at the root of the repository. Some secrets are shared between services.

In the dockerfiles and docker-compose, the secret's variable name are appended with "\_FILE" and designate the name of the file that will be added to the container. This file will contain the secret's value. Its content will be put as an environement variable of the name detailed in the following table. The content must be on the first line and must be the only thing in the file.

An example could be `JQH_API_KEY` being stored as `JQH_API_KEY_FILE` in the dockerfiles and docker-compose.

The following secrets are necessary for the full features:

| File name                | Environment variable name | Content details                                   | Application using the variable    |
| ------------------------ | ------------------------- | ------------------------------------------------- | --------------------------------- |
| jqh_api_key.secret       | JQH_API_KEY               | The API key for the Jobs Queue                    | Flow Manager, Workers, Jobs Queue |
| fm_api_key.secret        | FM_API_KEY                | Flow Manager's API key for workers to report data | Flow Manager, Workers             |
| fm_jwt_secret.secret     | FM_JWT_SECRET             | The secret to sign JWT for users                  | Flow Manager                      |
| fm_refresh_secret.secret | FM_REFRESH_SECRET         | The secret to sign JWT refresh token for users    | Flow Manager                      |

## Config files

#### Worker (jobs handler)

file must be called `jobs_handler.config` and be in the same directory as `jobs_handler.py`

```
job_queue_handler_address=jqh
job_queue_handler_port=5000
flow_manager_address=fm
flow_manager_port=3000
env=DEV
amass_config=/bin/amass/amass.config
amass_bin_path=/bin/amass/
amass_wordlists=/wordlist/path/
```
