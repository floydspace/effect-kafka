# Effect Kafka

[`effect-kafka`](https://github.com/floydspace/effect-kafka) is a Kafka client for [Effect](https://github.com/Effect-TS/effect). It provides a purely functional interface to the Kafka client and integrates effortlessly with Effect ecosystem.

[![npm version](https://img.shields.io/npm/v/effect-kafka?color=brightgreen&label=npm%20package)](https://www.npmjs.com/package/effect-kafka)
[![npm downloads](https://img.shields.io/npm/dm/effect-kafka)](https://www.npmjs.com/package/effect-kafka)
[![build status](https://img.shields.io/github/actions/workflow/status/floydspace/effect-kafka/release.yml?branch=main)](https://github.com/floydspace/effect-kafka/actions)
[![wakatime](https://wakatime.com/badge/github/floydspace/effect-kafka.svg)](https://wakatime.com/badge/github/floydspace/effect-kafka)

Effect Docs: https://www.effect.website<br>
Effect Reference: https://effect-ts.github.io/effect<br>
Effect Kafka Reference: https://floydspace.github.io/effect-kafka

# Installation

Choose your preferred package manager and run one of the following commands in your terminal:

- **Using npm:**

  ```sh
  npm install effect-kafka
  ```

- **Using pnpm:**

  ```sh
  pnpm add effect-kafka
  ```

- **Using yarn:**
  ```sh
  yarn add effect-kafka
  ```

Next install one of kafka engine packages:
- [KafkaJS](https://github.com/tulios/kafkajs?tab=readme-ov-file#-getting-started) - Fully JavaScript implementation.
- [@confluentinc/kafka-javascript](https://github.com/confluentinc/confluent-kafka-javascript?tab=readme-ov-file#requirements) - JavaScript interface for C++ librdkafka implementation, which is more performant, but requires native bindings.
- [@platformatic/kafka](https://github.com/platformatic/kafka?tab=readme-ov-file#installation) - New pure JavaScript Kafka client implementation with ambition to replace KafkaJS

_**Note:** You can use any of the above Kafka engine packages, depending on your preference._

# Usage

Let's write a simple Kafka producer and consumer using `effect-kafka`. Before everything, we need a running instance of Kafka. We can do that by saving the following docker-compose script in the `docker-compose.yml` file and run `docker-compose up`:

```yaml
version: '2'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - 22181:2181
  
  kafka:
    image: confluentinc/cp-kafka:latest
    depends_on:
      - zookeeper
    ports:
      - 29092:29092
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092,PLAINTEXT_HOST://localhost:29092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
```

Now, we can run our `effect-kafka` application:
```typescript
import { NodeRuntime } from "@effect/platform-node";
import { Console, Effect, Layer, Random, Schedule, Stream } from "effect";
import { Consumer, Producer } from "effect-kafka";
import { ConfluentKafkaJS } from "effect-kafka/ConfluentKafka";

const producer = Stream.repeatEffect(Random.nextInt).pipe(
  Stream.schedule(Schedule.fixed("2 seconds")),
  Stream.flatMap((random) =>
    Producer.send({
      topic: "random",
      messages: [{ key: String(random % 4), value: random.toString() }],
    }),
  ),
);

const consumer = Consumer.serveStream("random").pipe(
  Stream.tap((record) => Console.log(record.value?.toString()))
);

const program = Stream.merge(producer, consumer).pipe(Stream.runDrain);

const ProducerLive = Producer.layer({ allowAutoTopicCreation: true });
const ConsumerLive = Consumer.layer({ groupId: "group" });

const KafkaLive = ConfluentKafkaJS.layer({ brokers: ["localhost:29092"] });
const MainLive = program.pipe(
  Effect.provide(Layer.merge(ProducerLive, ConsumerLive)),
  Effect.provide(KafkaLive)
);

NodeRuntime.runMain(MainLive);
```

See more examples in the [examples](./examples) directory.

# Roadmap

- [x] Consumer
- [x] Producer
- [x] Consumer Streams
- [ ] Producer Streams
- [x] Acknowledge management
- [ ] Transactions

# Contributing Guidelines

Thank you for considering contributing to our project! Here are some guidelines to help you get started:

## Reporting Bugs

If you have found a bug, please open an issue on our [issue tracker](https://github.com/floydspace/effect-kafka/issues) and provide as much detail as possible. This should include:

- A clear and concise description of the problem
- Steps to reproduce the problem
- The expected behavior
- The actual behavior
- Any relevant error messages or logs

## Suggesting Enhancements

If you have an idea for an enhancement or a new feature, please open an issue on our [issue tracker](https://github.com/floydspace/effect-kafka/issues) and provide as much detail as possible. This should include:

- A clear and concise description of the enhancement or feature
- Any potential benefits or use cases
- Any potential drawbacks or trade-offs

## Pull Requests

We welcome contributions via pull requests! Here are some guidelines to help you get started:

1. Fork the repository and clone it to your local machine.
2. Create a new branch for your changes: `git checkout -b my-new-feature`
3. Install dependencies: `pnpm install` (`pnpm@9.x`, using `corepack`)
    - if you introduce new dependencies, please use `.projenrc.ts` to add them
    - then run `pnpm default` to update the project
4. Make your changes and add tests if applicable.
5. Run the tests: `pnpm test`
6. Commit your changes: `git commit -am 'Add some feature'`
7. Push your changes to your fork: `git push origin my-new-feature`
8. Open a pull request against our `main` branch.

### Pull Request Guidelines

- Please make sure your changes are consistent with the project's existing style and conventions.
- Please write clear commit messages and include a summary of your changes in the pull request description.
- Please make sure all tests pass and add new tests as necessary.
- If your change requires documentation, please update the relevant documentation.
- Please be patient! We will do our best to review your pull request as soon as possible.

## License

By contributing to this project, you agree that your contributions will be licensed under the project's [MIT License](./LICENSE).

# Sponsors

We are grateful to the following sponsors for supporting this project:

<div style="display: flex">
    <div style="display: flex; justify-content: center; flex-direction: column; align-items: center">
        <a href="https://github.com/superwall">
        <img title="@superwall" src="https://avatars.githubusercontent.com/u/88794805?s=200&amp;v=4" width="75" height="75" alt="@superwall">
        </a>
        <div>Superwall</div>
    </div>
</div>