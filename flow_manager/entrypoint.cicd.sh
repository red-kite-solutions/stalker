#!/usr/bin/env bash

set -e

file_env() {
   local var="$1"
   local fileVar="${var}_FILE"
   local def="${2:-}"

   if [ "${!var:-}" ] && [ "${!fileVar:-}" ]; then
      echo >&2 "error: both $var and $fileVar are set (but are exclusive)"
      exit 1
   fi
   local val="$def"
   if [ "${!var:-}" ]; then
      val="${!var}"
   elif [ "${!fileVar:-}" ]; then
      val="$(< "${!fileVar}")"
   fi
   export "$var"="$val"
   unset "$fileVar"
}

file_env "JQH_API_KEY"
file_env "FM_API_KEY"
file_env "FM_JWT_SECRET"
file_env "FM_REFRESH_SECRET"

export KEYBASE_ALLOW_ROOT=1
keybase ctl init

npm run-script test:cicd