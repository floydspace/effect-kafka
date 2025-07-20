# Admin

The `Admin` module provides functionality to manage Kafka topics, currently only listing topics is supported. But more operations will be added in the future.

## List topics

`listTopics` lists the names of all existing topics, and returns an array of strings.

Yield the module to get access to the operations and call the `listTopics`.


::: code-group

```ts{1,6-9} [.gen]
import { Admin } from "effect-kafka"
import { Effect } from "effect"

//       ┌─── Effect.Effect<readonly string[], AdminError, Admin.Admin>
//       ▼
const program = Effect.gen(function* () {
  const admin = yield* Admin.Admin
  return yield* admin.listTopics()
})
```

```ts{1,6-8} [.pipe]
import { Admin } from "effect-kafka"
import { Effect } from "effect"

//       ┌─── Effect.Effect<readonly string[], AdminError, Admin.Admin>
//       ▼
const program = Admin.Admin.pipe(
  Effect.flatMap((admin) => admin.listTopics())
)
```

:::

You can also use module function directly, which is a more concise way to access the admin operations:

```ts{1,6}
import { Admin } from "effect-kafka"
import { Effect } from "effect"

//       ┌─── Effect.Effect<readonly string[], AdminError, Admin.Admin>
//       ▼
const program = Admin.listTopics()
```

> [!WARNING]
> Be cautious when using module functions, as they could lead to requirements leakage when used in downstream services. Read more about [Avoiding Requirement Leakage](https://effect.website/docs/requirements-management/layers/#avoiding-requirement-leakage).


## Layer

To use the `Admin` module operations, you need to provide the `Admin` layer. This can be done using the `Admin.layer()` function.

```ts{8}
import { NodeRuntime } from "@effect/platform-node"
import { Effect } from "effect"
import { Admin } from "effect-kafka"
import { KafkaJS } from "effect-kafka/KafkaJS"

const program = Admin.listTopics()

const main = program.pipe(
    Effect.provide(Admin.layer()), // [!code focus]
    Effect.provide(KafkaJS.layer({ brokers: ["localhost:19092"] })),
)

NodeRuntime.runMain(main);
```
