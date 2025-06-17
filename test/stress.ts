import { Server, Socket as ServerSocket } from "socket.io";
import { Socket as ClientSocket, io } from "socket.io-client";
import { HazelcastClient } from "hazelcast-client";
import { createHazelcastAdapter, HazelcastAdapterOptions } from "../lib";
import { setup, sleep } from "./util"; // Assuming util.ts exports these

export async function runStressTest(
  hzClient: HazelcastClient,
  numClients: number,
  numMessagesPerClient: number
) {
  console.log(
    `Starting stress test with ${numClients} clients and ${numMessagesPerClient} messages per client.`
  );

  let servers: Server[] = [];
  let clientSockets: ClientSocket[] = [];
  let receivedMessages = 0;
  const totalMessagesExpected = numClients * numMessagesPerClient;
  let testCleanup: () => Promise<void> | void = async () => {};

  const adapterFactory = createHazelcastAdapter(hzClient, {
    key: `stress-test-${Date.now()}`,
    requestsTimeout: 10000 // Increased timeout for stress conditions
  } as Partial<HazelcastAdapterOptions>);

  try {
    // Setup a single server for the stress test
    const testContext = await setup(adapterFactory, 1); // Using 1 server, 0 clients from setup initially
    servers = testContext.servers;
    // We will create clients manually for the stress test
    testCleanup = testContext.cleanup;

    const server = servers[0];
    const serverAddress = `http://localhost:${(server.engine as any).httpServer.address().port}`;

    // Event handler for messages from clients
    server.on("connection", (socket: ServerSocket) => {
      socket.on("client_message", (msg: string) => {
        // server.emit("server_message", `Message received: ${msg}`); // Echo back or broadcast
        receivedMessages++;
        if (receivedMessages === totalMessagesExpected) {
          // All messages received
        }
      });
    });

    const connectionPromises: Promise<ClientSocket>[] = [];

    for (let i = 0; i < numClients; i++) {
      const clientSocket = io(serverAddress, {
        transports: ["websocket"],
        forceNew: true, // Ensure new connection for each client
      });

      clientSocket.on("connect_error", (err) => {
        console.error(`Client ${i} connection error:`, err.message);
      });

      const connectPromise = new Promise<ClientSocket>((resolve, reject) => {
        clientSocket.on("connect", () => {
          clientSockets.push(clientSocket);
          resolve(clientSocket);
        });
        clientSocket.on("connect_error", reject); // Should be handled by outer handler too, but good for promise
      });
      connectionPromises.push(connectPromise);
    }

    await Promise.all(connectionPromises);
    console.log(`${clientSockets.length} clients connected.`);
    if (clientSockets.length !== numClients) {
        throw new Error(`Expected ${numClients} clients to connect, but only ${clientSockets.length} did.`);
    }


    const startTime = Date.now();

    for (let i = 0; i < clientSockets.length; i++) {
      const clientSocket = clientSockets[i];
      for (let j = 0; j < numMessagesPerClient; j++) {
        clientSocket.emit("client_message", `Message ${j} from client ${i}`);
      }
    }

    // Wait for all messages to be processed or a timeout
    const timeoutPromise = sleep(30000 + numClients * numMessagesPerClient * 10); // Dynamic timeout
    const waitForMessages = async () => {
        while(receivedMessages < totalMessagesExpected) {
            await sleep(100); // check every 100ms
        }
    }

    await Promise.race([waitForMessages(), timeoutPromise]);

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`Stress test finished in ${duration} ms.`);
    console.log(`Total messages sent: ${numClients * numMessagesPerClient}`);
    console.log(`Total messages received: ${receivedMessages}`);

    if (receivedMessages !== totalMessagesExpected) {
      console.warn(
        `Mismatch in messages: Expected ${totalMessagesExpected}, Received ${receivedMessages}`
      );
    }

    return {
      numClients,
      numMessagesPerClient,
      duration,
      totalMessagesSent: numClients * numMessagesPerClient,
      totalMessagesReceived: receivedMessages,
      successful: receivedMessages === totalMessagesExpected,
    };
  } finally {
    // Cleanup
    console.log("Cleaning up stress test resources...");
    clientSockets.forEach((socket) => socket.disconnect());
    await testCleanup(); // Use the cleanup from setup
    console.log("Cleanup complete.");
  }
}
