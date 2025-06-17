# Socket.IO Hazelcast Adapter

The `@socket.io/hazelcast-adapter` package allows broadcasting packets between multiple Socket.IO servers using Hazelcast.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/adapter_dark.png">
  <img alt="Diagram of Socket.IO packets forwarded through a distributed message broker" src="./assets/adapter.png">
</picture>

**Table of contents**

- [Supported features](#supported-features)
- [Installation](#installation)
- [Usage](#usage)
- [Options](#options)
- [License](#license)

## Supported features

The Hazelcast adapter supports the following features from Socket.IO:

| Feature                         | `socket.io` version | Support                                        |
|---------------------------------|---------------------|------------------------------------------------|
| Socket Management (Rooms, SIDs) | `4.0.0`             | :white_check_mark: YES                         |
| Inter-server communication      | `4.1.0`             | :white_check_mark: YES                         |
| Broadcast with acknowledgements | `4.5.0`             | :warning: YES (with limitations, see below)    |
| Connection state recovery       | `4.6.0`             | :x: NO                                         |

## Installation

```
npm install @socket.io/hazelcast-adapter hazelcast-client
```
Note: `hazelcast-client` is a peer dependency and needs to be installed alongside the adapter.

## Usage

The `@socket.io/hazelcast-adapter` allows broadcasting events to and from a group of Socket.IO servers backed by a [Hazelcast](https://hazelcast.com/) cluster.

```javascript
import { Server } from "socket.io";
import { HazelcastClient } from "hazelcast-client";
import { createHazelcastAdapter } from "@socket.io/hazelcast-adapter"; // Assuming this will be the final package name

const io = new Server();
const hzClient = await HazelcastClient.newHazelcastClient({
  // Hazelcast client configuration, e.g.:
  // clusterName: "my-cluster",
  // network: {
  //   clusterMembers: ["127.0.0.1:5701"]
  // }
});

io.adapter(createHazelcastAdapter(hzClient));
// ... or with options:
// io.adapter(createHazelcastAdapter(hzClient, { key: "my-custom-prefix", requestsTimeout: 7000 }));

io.listen(3000);
```

**Note on `broadcastWithAck`:** Cross-server acknowledgements for `broadcastWithAck` have limitations where client ACKs are only routed to the originating server. Full aggregation of client ACKs across multiple servers for a single `broadcastWithAck` call is not supported by this adapter. However, server-to-server ACKs (e.g., for `serverSideEmit` with a callback) are fully supported.

## Options

The `createHazelcastAdapter` function accepts an optional second argument for configuration options:

| Name               | Description                                                                                                | Default value        |
|--------------------|------------------------------------------------------------------------------------------------------------|----------------------|
| `key`              | The prefix for Hazelcast Topic names used by the adapter. Useful for namespacing within a shared Hazelcast cluster. | `socket.io-hazelcast`|
| `requestsTimeout`  | Timeout (in milliseconds) for waiting for responses to requests between server nodes (e.g., for `fetchSockets`). | `5000`               |

Example with options:
```javascript
io.adapter(createHazelcastAdapter(hzClient, { 
  key: "my-app-socketio", 
  requestsTimeout: 10000 
}));
```

## License

[MIT](LICENSE)
