# Containers

Red Kite jobs run in containers to provide isolation as well as the proper environment. The containers can be specified on deployment by adding them to the `JM_JOB_CONTAINERS` environment variable.

By default, the two community containers are provided in the array. You can add your own containers by adding them to the array.

```yaml
JM_JOB_CONTAINERS: '["ghcr.io/red-kite-solutions/stalker-python-job-base:1", "ghcr.io/red-kite-solutions/stalker-nuclei-job-base:1"]'
```

> These containers are required to run the community jobs.
