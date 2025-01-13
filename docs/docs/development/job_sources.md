---
sidebar_position: 2
title: Job Sources
description: Have multiple sources for your Red Kite jobs.
---

# Job Sources

Red Kite jobs can come from two different sources. It can either be a local job stored in the database, or a remote job from a git repository.

## Local Jobs

Local jobs are stored locally in Red Kite's database. You can edit and delete them as you please through the web editor.

## Remote Jobs

The remote jobs are contained in a remote git repository. These repositories need to be configured at the platform launch in the `RK_DATA_SOURCES` environment variable. Its value consists of an array of job sources.

Its default value includes the jobs from [Red Kite Solutions' community repository](https://github.com/red-kite-solutions/stalker-templates-community). The enterprise version includes the jobs from the enterprise repository as well.

To include another repository, simply add another job source in the array.

The default value:

```yaml
RK_DATA_SOURCES: '[{"type": "git", "url": "https://github.com/red-kite-solutions/stalker-templates-community", "branch": "main"}]'
```

The actual JSON value specifies the url of the repository and the targeted branch.

```json
{
  "type": "git",
  "url": "https://github.com/red-kite-solutions/stalker-templates-community",
  "branch": "main"
}
```
