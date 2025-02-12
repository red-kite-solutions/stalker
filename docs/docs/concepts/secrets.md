---
sidebar_position: 6
title: Secrets
description: What are secrets and how to use them
---

# Secrets

Secrets are encrypted variables that can be given to jobs as parameters. The secrets are decrypted right before being given to the job. They
can then be used to connect to third-party services.

To create a secret in Red Kite, you need to provide a secret name and a value. You can also provide a description to help you remember what
the secret is about. A secret can be global or can be assigned to a project. You assign the secret to a project during creation by selecting
the project in the drop-down menu. A global secret can be used with any project. A project secret with the same name will overwrite a global
secret.

To inject a secret while launching a job or in a subscription, simply use the `${{ secrets.secretName }}` notation, where `secretName` is
the name of the secret you want to inject. Secrets, when injecting, always need to be prefixed with the `secrets.` scope information.

> Secrets are encrypted using asymmetric encryption; they are decrypted at the very last minute to ensure maximum security and minimal
> exposure.

## Injecting while launching a job

To inject a secret called `secretName` in a parameter called `MyParameterName` while launching a job, do the following:

```yaml
parameters:
  - name: MyParameterName
    value: ${ secrets.secretName }
```

## Injecting in a subscription

To inject a secret called `secretName` in a parameter called `MyParameterName` in a subscription, do the following:

```yaml
name: My custom job subscription
finding: PortFinding
cooldown: 82800
job:
  name: CustomJobName
  parameters:
    - name: myCustomParameter
      value: "This is a custom parameter"
    - name: myFindingIpParameter
      value: ${ip}
    - name: myFindingPortParameter
      value: ${port}
    - name: MyParameterName
      value: ${secrets.secretName}
```

[Click here to learn more about subscriptions.](./subscriptions.md)
