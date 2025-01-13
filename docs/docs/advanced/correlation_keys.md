# Correlation keys

Correlation keys are strings that uniquely identify a resource for a project. Each resource has a correlation key. If the resource is deleted and recreated for the same project, its correlation key will be identical. A resource can therefore be identified through its `correlationKey` value.

Correlation keys are used by event subscriptions to know if their cooldown for a resource is expired, and the event subscription is ready to trigger again. It will also use the resource's correlation key to find the resource and see if it is blocked.

Examples of correlation keys for a project with the identifier `65f123fc861a16c1a9698357`:

| Resource | Correlation key example                                                                            |
| -------- | -------------------------------------------------------------------------------------------------- |
| Domain   | `project:65f123fc861a16c1a9698357;domain:example.com`                                              |
| Host     | `project:65f123fc861a16c1a9698357;host:127.0.0.1`                                                  |
| Port     | `project:65f123fc861a16c1a9698357;host:127.0.0.1;port:22;protocol:tcp`                             |
| Website  | `project:65f123fc861a16c1a9698357;host:206.189.173.197;port:80;protocol:tcp;domain:a1b2.ca;path:/` |

A correlation key also exists for a different concept that is not really a resource per say. This concept is the `IP ranges`. IP ranges are stored on the project itself, and they represent an IPv4 subnet range.

A correlation key for an IP range would look like the following, where mask is a value between 0 and 32, inclusively:

| Entity   | Correlation key example                                   |
| -------- | --------------------------------------------------------- |
| Ip range | `project:65f123fc861a16c1a9698357;host:127.0.0.1;mask:32` |
