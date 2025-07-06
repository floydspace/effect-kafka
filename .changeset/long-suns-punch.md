---
"effect-kafka": minor
---

Implement methods for defining and parsing kafka messages with effect Schema

Ho to use:

1. When you parse raw kafka message, you can use the `MessageRouter.schemaRaw` in combination with `ConsumerSchema` helper methods to define the schema of the message.
```ts
import { Console, Effect, Schema } from "effect";
import { Consumer, ConsumerSchema, MessageRouter } from "effect-kafka";

const ConsumerLive = MessageRouter.empty.pipe(
  MessageRouter.subscribe(
    "test-topic",
    MessageRouter.schemaRaw(
      Schema.Struct({
        topic: Schema.Literal("test-topic"),
        partition: Schema.Number,
        offset: Schema.NumberFromString,
        key: Schema.NullOr(ConsumerSchema.Number),
        value: ConsumerSchema.String,
      }),
    ).pipe(
      Effect.flatMap(({ topic, partition, ...message }) =>
        Console.log({
          topic,
          partition,
          offset: message.offset,
          key: message.key,
          value: message.value,
        }),
      ),
    ),
  ),
  Consumer.serve({ groupId: "group" }),
);
```

2. When you parse raw kafka message, you can use the `MessageRouter.schemaJson` if you expect kafka message `value` to be a JSON string. So `value` schema property can be defined as `Schema.Struct`.
```ts
import { Console, Effect, Schema } from "effect";
import { Consumer, ConsumerSchema, MessageRouter } from "effect-kafka";

const ConsumerLive = MessageRouter.empty.pipe(
  MessageRouter.subscribe(
    "test-topic",
    MessageRouter.schemaJson(
      Schema.Struct({
        topic: Schema.Literal("test-topic"),
        partition: Schema.Number,
        offset: Schema.NumberFromString,
        key: Schema.NullOr(ConsumerSchema.Number),
        value: Schema.Struct({ message: Schema.String }),
      }),
    ).pipe(
      Effect.flatMap(({ topic, partition, ...message }) =>
        Console.log({
          topic,
          partition,
          offset: message.offset,
          key: message.key,
          value: message.value.message,
        }),
      ),
    ),
  ),
  Consumer.serve({ groupId: "group" }),
);
```

3. When you parse only kafka message raw `value` as raw value, you can use the `ConsumerRecord.schemaValueRaw` in combination with `ConsumerSchema` helper methods to define the schema of the message value.
```ts
import { Console, Effect } from "effect";
import { Consumer, ConsumerRecord, ConsumerSchema, MessageRouter } from "effect-kafka";

const ConsumerLive = MessageRouter.empty.pipe(
  MessageRouter.subscribe(
    "customers",
    ConsumerRecord.schemaValueRaw(ConsumerSchema.String).pipe(
      Effect.flatMap((value) => Console.log(value)),
    ),
  ),
  Consumer.serve({ groupId: "group" }),
);
```

4. When you parse only kafka message `value` as json value, you can use the `ConsumerRecord.schemaValueJson`. So `value` schema can be defined as `Schema.Struct`.
```ts
import { Console, Effect } from "effect";
import { Consumer, ConsumerRecord, MessageRouter } from "effect-kafka";

const ConsumerLive = MessageRouter.empty.pipe(
  MessageRouter.subscribe(
    "customers",
    ConsumerRecord.schemaValueJson(Schema.Struct({ message: Schema.String })).pipe(
      Effect.flatMap((value) => Console.log(value)),
    ),
  ),
  Consumer.serve({ groupId: "group" }),
);
```