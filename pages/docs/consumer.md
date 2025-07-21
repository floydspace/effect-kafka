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

## Message schema

When consuming messages, you often need to parse the message value according to a specific schema. The `MessageRouter` and `ConsumerRecord` modules provide convenience functions to define such schemas incorporating the effect `Schema` module.

### MessageRouter.schemaRaw

When you need to parse the whole raw Kafka message, you can use the `MessageRouter.schemaRaw` function. This function allows you to define a schema for the entire message, including the topic, partition, offset, key, and value.

You can also use the `ConsumerSchema` module, which provides various transformation schemas from `Uint8Array` byte sequences to more specific types.

```ts{1,9-17,19-21}
import { ConsumerSchema, MessageRouter } from "effect-kafka"
import { Effect, Schema } from "effect"

//       ┌─── MessageRouter.MessageRouter<ParseError, never>
//       ▼
const router = MessageRouter.empty.pipe(
  MessageRouter.subscribe(
    "my-topic",
    MessageRouter.schemaRaw(
      Schema.Struct({
        topic: Schema.Literal("my-topic"),
        partition: Schema.Number,
        offset: Schema.NumberFromString,
        key: Schema.NullOr(ConsumerSchema.Number),
        value: ConsumerSchema.String,
      }),
    ).pipe(
      Effect.flatMap((message) =>
        //                               ┌─ number | null   ┌─ string
        //                               ▼                  ▼
        Effect.log(`Received: ${message.key} -> ${message.value}`),
      ),
    ),
  ),
)
```

### MessageRouter.schemaJson

When you expect the Kafka message value to be a JSON string, you can use the `MessageRouter.schemaJson` function. This function allows you to define a schema for the message value as a JSON object.

```ts{9-17,19-21}
import { ConsumerSchema, MessageRouter } from "effect-kafka"
import { Effect, Schema } from "effect"

//       ┌─── MessageRouter.MessageRouter<ParseError, never>
//       ▼
const router = MessageRouter.empty.pipe(
  MessageRouter.subscribe(
    "my-topic",
    MessageRouter.schemaJson(
      Schema.Struct({
        topic: Schema.Literal("my-topic"),
        partition: Schema.Number,
        offset: Schema.NumberFromString,
        key: Schema.NullOr(ConsumerSchema.Number),
        value: Schema.Struct({ message: Schema.String }),
      }),
    ).pipe(
      Effect.flatMap((message) =>
        //                    { readonly message: string } ─┐
        //                                                  ▼
        Effect.log(`Received: ${message.key} -> ${message.value}`),
      ),
    ),
  ),
)
```

### ConsumerRecord.schemaValueRaw

When you only need to parse the raw value of the Kafka message, you can use the `ConsumerRecord.schemaValueRaw` function in combination with the `ConsumerSchema` helper methods. This allows you to define the schema of the message value without parsing the entire message.

```ts{1,9-13}
import { ConsumerRecord, ConsumerSchema, MessageRouter } from "effect-kafka"
import { Effect } from "effect"

//       ┌─── MessageRouter.MessageRouter<ParseError, never>
//       ▼
const router = MessageRouter.empty.pipe(
  MessageRouter.subscribe(
    "my-topic",
    ConsumerRecord.schemaValueRaw(ConsumerSchema.String).pipe(
      //                                                  ┌─ string
      //                                                  ▼
      Effect.flatMap((value) => Effect.log(`Received: ${value}`)),
    ),
  ),
)
```

### ConsumerRecord.schemaValueJson

When you expect the Kafka message value to be a JSON string, you can use the `ConsumerRecord.schemaValueJson` function. This function allows you to define a schema for the message value as a JSON object.

```ts{1,9-17}
import { ConsumerRecord, ConsumerSchema, MessageRouter } from "effect-kafka"
import { Effect, Schema } from "effect"

//       ┌─── MessageRouter.MessageRouter<ParseError, never>
//       ▼
const router = MessageRouter.empty.pipe(
  MessageRouter.subscribe(
    "my-topic",
    ConsumerRecord.schemaValueJson(
      Schema.Struct({
        message: Schema.String,
      }),
    ).pipe(
      //                    { readonly message: string } ─┐
      //                                                  ▼
      Effect.flatMap((value) => Effect.log(`Received: ${value}`)),
    ),
  ),
)
```

### Schema parsing when streaming

When consuming messages as a stream, you don't need any specific schema parsing functions. Just simply use `Schema.decodeUnknown` as is
```ts{1,8-16,19-21}
import { Effect, Schema, Stream } from "effect"
import { Consumer, ConsumerSchema } from "effect-kafka"

//       ┌─── Stream.Stream<ConsumerRecord, ParseError, Consumer.Consumer>
//       ▼
const stream = Consumer.serveStream("my-topic").pipe(
  Stream.flatMap(
    Schema.decodeUnknown(
      Schema.Struct({
        topic: Schema.Literal("my-topic"),
        partition: Schema.Number,
        offset: Schema.NumberFromString,
        key: Schema.NullOr(ConsumerSchema.Number),
        value: ConsumerSchema.String,
      }),
    ),
  ),
  Stream.tap((message) => 
    //                               ┌─ number | null   ┌─ string
    //                               ▼                  ▼
    Effect.log(`Received: ${message.key} -> ${message.value}`),
  ),
)
```