# Consumer

The `Consumer` module provides functionality to consume messages from Kafka topics. There are two main ways to consume messages: using the `MessageRouter` module or using streaming.

## Message router

The `MessageRouter` module allows you to consume messages from Kafka topics in a more structured way, where you can subscribe to specific topics and define their handlers.

```ts{1,6-13}
import { ConsumerRecord, MessageRouter } from "effect-kafka";
import { Effect } from "effect"

//       ┌─── MessageRouter.MessageRouter<never, never>
//       ▼
const router = MessageRouter.empty.pipe(
  MessageRouter.subscribe(
    "my-topic",
    Effect.flatMap(ConsumerRecord.ConsumerRecord, (message) =>
      Effect.log(`Received: ${message.key} -> ${message.value}`),
    ),
  ),
)
```

Than you need to serve the router using `Consumer.serveEffect` or `Consumer.serve`, both of them accept a `ConsumerOptions` object to configure the internal consumer client. See the [ConsumerOptions (interface)](https://floydspace.github.io/effect-kafka/modules/Consumer.ts.html#consumeroptions-interface) API reference for more details.

::: code-group

```ts{16} [Consumer.serveEffect]
import { NodeRuntime } from "@effect/platform-node"
import { Effect } from "effect"
import { Consumer, ConsumerRecord, MessageRouter } from "effect-kafka"
import { KafkaJS } from "effect-kafka/KafkaJS"

const router = MessageRouter.empty.pipe( // [!code focus:14]
  MessageRouter.subscribe(
    "my-topic",
    Effect.flatMap(ConsumerRecord.ConsumerRecord, (message) =>
      Effect.log(`Received: ${message.key} -> ${message.value}`),
    ),
  ),
)

const main = router.pipe(
  Consumer.serveEffect({ groupId: "my-group" }),
  Effect.scoped,
  Effect.provide(KafkaJS.layer({ brokers: ["localhost:19092"] })),
);

NodeRuntime.runMain(main)
```

```ts{16} [Consumer.serve]
import { NodeRuntime } from "@effect/platform-node"
import { Effect, Layer } from "effect"
import { Consumer, ConsumerRecord, MessageRouter } from "effect-kafka"
import { KafkaJS } from "effect-kafka/KafkaJS"

const router = MessageRouter.empty.pipe( // [!code focus:14]
  MessageRouter.subscribe(
    "my-topic",
    Effect.flatMap(ConsumerRecord.ConsumerRecord, (message) =>
      Effect.log(`Received: ${message.key} -> ${message.value}`),
    ),
  ),
)

const MainLive = router.pipe(
  Consumer.serve({ groupId: "my-group" }),
  Layer.provide(KafkaJS.layer({ brokers: ["localhost:19092"] })),
);

NodeRuntime.runMain(Layer.launch(MainLive))
```
:::

> [!TIP]
> Read more about how your entire program might be a `Layer` in the [Converting a Layer to an Effect](https://effect.website/docs/requirements-management/layers/#converting-a-layer-to-an-effect).

## Streaming

The `Consumer` module also provides the `Consumer.serveStream` function, which allows you to consume a topic as a stream of messages.

```ts{3,8-12,16}
import { NodeRuntime } from "@effect/platform-node"
import { Effect, Stream } from "effect"
import { Consumer } from "effect-kafka"
import { KafkaJS } from "effect-kafka/KafkaJS"

//       ┌─── Stream.Stream<ConsumerRecord, never, Consumer.Consumer>
//       ▼
const stream = Consumer.serveStream("my-topic").pipe(
  Stream.tap((message) => 
    Effect.log(`Received: ${message.key} -> ${message.value}`),
  ),
)

const main = stream.pipe(
  Stream.runDrain,
  Effect.provide(Consumer.layer({ groupId: "my-group" })),
  Effect.provide(KafkaJS.layer({ brokers: ["localhost:19092"] })),
)

NodeRuntime.runMain(main)
```

To use the `Consumer.serveStream`, you need to provide the `Consumer` layer. This can be done using the `Consumer.layer()` function, which accepts a `ConsumerOptions` too.