# Releasing

In this guide, you will be provided with clear instructions on how to release a new version of Stalker.

Micro-services and frontend have their own release cycle and version number. The software versions follow to the principles of semantic
versioning, as outlined in https://semver.org. To indicate alpha or beta versions, the suffixes "-alpha.0", "alpha.1", "beta.0", etc. are
added.

## Releasing a new version

In order to release a new version of a component, be it a micro-service or a frontend, you must simply push a tag following this specific
convention: <component>/<version>.

Here are examples for every component.

| Component                                                                                         | Examples              |                               |
| ------------------------------------------------------------------------------------------------- | --------------------- | ----------------------------- |
| [stalker-app ](https://github.com/red-kite-solutions/stalker/pkgs/container/stalker-app)          | `stalker-app/v1.2.0`  | `stalker-app/v1.2.0-alpha.7`  |
| [jobs-manager](https://github.com/red-kite-solutions/stalker/pkgs/container/stalker-jobs-manager) | `jobs-manager/1.2.0`  | `jobs-manager/1.2.0-alpha.7`  |
| [orchestrator](https://github.com/red-kite-solutions/stalker/pkgs/container/stalker-orchestrator) | `orchestrator/v1.2.0` | `orchestrator/v1.2.0-alpha.7` |
