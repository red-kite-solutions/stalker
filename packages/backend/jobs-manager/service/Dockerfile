FROM ghcr.io/red-kite-solutions/stalker-base:latest AS build

WORKDIR /app
RUN yarn workspace @red-kite/jobs-manager build:prod
RUN ls /app/packages/backend/jobs-manager/service/

FROM node:19.6.1-alpine3.16
COPY --from=build /app/packages/backend/jobs-manager/service/dist /server/dist
COPY --from=build /app/packages/backend/jobs-manager/service/node_modules /server/node_modules

# Built-in content
COPY --from=build /app/packages/backend/jobs-manager/service/src/modules/database/subscriptions/event-subscriptions/built-in/ /server/dist/src/modules/database/subscriptions/event-subscriptions/built-in/
COPY --from=build /app/packages/backend/jobs-manager/service/src/modules/database/subscriptions/cron-subscriptions/built-in/ /server/dist/src/modules/database/subscriptions/cron-subscriptions/built-in/
COPY --from=build /app/packages/backend/jobs-manager/service/src/modules/database/custom-jobs/built-in/ /server/dist/src/modules/database/custom-jobs/built-in/
COPY --from=build /app/packages/backend/jobs-manager/service/src/modules/notifications/emails/templates/ /server/dist/src/modules/notifications/emails/templates/
COPY --from=build /app/packages/backend/jobs-manager/service/src/modules/database/custom-job-templates/built-in/ /server/dist/src/modules/database/custom-job-templates/built-in/

ENTRYPOINT ["node", "/server/dist/src/main"]
