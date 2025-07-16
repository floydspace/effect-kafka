# Installation

Choose your preferred package manager and run one of the following commands in your terminal:

::: code-group

```sh [npm]
npm install effect-kafka
```

```sh [yarn]
yarn add effect-kafka
```

```sh [pnpm]
pnpm add effect-kafka
```

```sh [bun]
bun add effect-kafka
```

:::

Next install one of kafka engine packages:

::: code-group

```sh [KafkaJS]
pnpm add kafkajs
```

```sh [@confluentinc/kafka-javascript]
pnpm add @confluentinc/kafka-javascript
```

```sh [@platformatic/kafka]
pnpm add @platformatic/kafka
```


:::

- [KafkaJS](https://github.com/tulios/kafkajs?tab=readme-ov-file#-getting-started) - Fully JavaScript implementation.
- [@confluentinc/kafka-javascript](https://github.com/confluentinc/confluent-kafka-javascript?tab=readme-ov-file#requirements) - JavaScript interface for C++ librdkafka implementation, which is more performant, but requires native bindings.
- [@platformatic/kafka](https://github.com/platformatic/kafka?tab=readme-ov-file#installation) - New pure JavaScript Kafka client implementation with ambition to replace KafkaJS

_**Note:** You can use any of the above Kafka engine packages, depending on your preference._
