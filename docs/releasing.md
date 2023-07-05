# Releasing

This guide explains how to release a new version of Stalker.

Micro-services and frontend have their own release cycle and version number. The versions follow [semantic versioning](https://semver.org/).
Alpha and beta versions are denoted by appending "-alpha.0", "alpha.1", or "beta.0", ...

## Releasing a new version

In order to release a new version of a component, be it a micro-service or a frontend, you must simply push a tag following this specific
convention: <component>/<version>.

Here are examples for every component.

| Component    | Examples                                          |
| ------------ | ------------------------------------------------- |
| frontend     | frontend/v1.2.0, frontend/v1.2.0-alpha.7,         |
| flow-manager | flow-manager/1.2.0, flow-manager/1.2.0-alpha.7,   |
| orchestrator | orchestrator/v1.2.0, orchestrator/v1.2.0-alpha.7, |
