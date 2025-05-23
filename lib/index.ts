// uid2 is used by HazelcastAdapter internally, which is then imported here.
// So, if HazelcastAdapter handles its own uid2 import, this might not be strictly necessary here.
// However, keeping it for now as the original structure had it and it doesn't hurt.
import uid2 = require("uid2"); 

// Hazelcast Adapter imports
import { 
  createAdapter as createHazelcastAdapterFactory,
  HazelcastAdapter as HazelcastAdapterClass, 
  HazelcastAdapterOptions as HazelcastAdapterOptionsType 
} from "./hazelcast-adapter";

// Named exports for Hazelcast Adapter
export {
  createHazelcastAdapterFactory as createHazelcastAdapter,
  HazelcastAdapterClass as HazelcastAdapter,
  HazelcastAdapterOptionsType as HazelcastAdapterOptions
};

// The file is now focused solely on exporting Hazelcast-related components.
// All Redis-specific code, types, interfaces, enums, and factory functions
// have been removed. Imports for msgpack.io and ./util are also gone.
// The sharded Redis adapter (createRedisShardedAdapter) has also been removed
// as part of removing all Redis functionality.
