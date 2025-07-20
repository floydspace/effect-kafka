# Producer

The `Producer` module provides functionality to send messages to Kafka topics.

## Send messages

`send` sends messages to a single Kafka topic.

Yield the module to get access to the operations and call the `send`.


::: code-group

```ts{1,6-12} [.gen]
import { Producer } from "effect-kafka"
import { Effect } from "effect"

//       ┌─── Effect.Effect<Producer.Producer.RecordMetadata[], ProducerError, Producer.Producer>
//       ▼
const program = Effect.gen(function* () {
  const producer = yield* Producer.Producer
  return yield* producer.send({
    topic: "test-topic",
    messages: [{ value: "Hello effect-kafka!" }],
  })
})
```

```ts{1,6-13} [.pipe]
import { Producer } from "effect-kafka"
import { Effect } from "effect"

//       ┌─── Effect.Effect<Producer.Producer.RecordMetadata[], ProducerError, Producer.Producer>
//       ▼
const program = Producer.Producer.pipe(
  Effect.flatMap((producer) =>
    producer.send({
      topic: "test-topic",
      messages: [{ value: "Hello effect-kafka!" }],
    }),
  ),
)
```

:::

You can also use module function directly, which is a more concise way to access the producer operations:

```ts{1,6-9}
import { Producer } from "effect-kafka";
import { Effect } from "effect";

//       ┌─── Effect.Effect<Producer.Producer.RecordMetadata[], ProducerError, Producer.Producer>
//       ▼
const program = Producer.send({
  topic: "test-topic",
  messages: [{ value: "Hello, effect-kafka!" }],
})
```

> [!WARNING]
> Be cautious when using module functions, as they could lead to requirements leakage when used in downstream services. Read more about [Avoiding Requirement Leakage](https://effect.website/docs/requirements-management/layers/#avoiding-requirement-leakage).


## Layer

To use the `Producer` module operations, you need to provide the `Producer` layer. This can be done using the `Producer.layer()` function.

The layer accepts `ProducerOptions` object to configure the internal producer client. See the [ProducerOptions (interface)](https://floydspace.github.io/effect-kafka/modules/Producer.ts.html#produceroptions-interface) API reference for more details.

```ts{8}
import { NodeRuntime } from "@effect/platform-node"
import { Effect } from "effect"
import { Producer } from "effect-kafka"
import { KafkaJS } from "effect-kafka/KafkaJS"

const program = Producer.send({
  topic: "test-topic",
  messages: [{ value: "Hello, effect-kafka!" }],
})

const main = program.pipe(
    Effect.provide(Producer.layer({ allowAutoTopicCreation: true })), // [!code focus]
    Effect.provide(KafkaJS.layer({ brokers: ["localhost:19092"] })),
);

NodeRuntime.runMain(main)
```
