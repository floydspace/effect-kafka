# Getting Started

Let's write a simple Kafka producer and consumer using `effect-kafka`. Make a new folder for your sample program and follow these steps:

## Step 1: Set up Kafka

Before everything, we need a running instance of Kafka. We can do that by saving the following docker-compose script in the `docker-compose.yml` file:

::: code-group
```yaml:line-numbers [docker-compose.yml]
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
:::

and run the docker compose:

```sh
docker compose up -d
```

## Step 2: Install Effect Kafka

Install `effect-kafka`, peer dependencies and a Kafka engine package of your choice.

```sh
pnpm add effect @effect/platform-node effect-kafka kafkajs
```

::: tip
You can use any of the supported Kafka engines, depending on your preference.
:::

## Step 3: Implement a program

Here's a simple example of a Kafka producer and consumer using `effect-kafka` with KafkaJS:

::: code-group
```ts:line-numbers [main.ts]
import { NodeRuntime } from "@effect/platform-node";
import { Console, Effect, Layer, Random, Schedule, Stream } from "effect";
import { Consumer, Producer } from "effect-kafka";
import { KafkaJS } from "effect-kafka/KafkaJS";

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

const KafkaLive = KafkaJS.layer({ brokers: ["localhost:29092"] });
const MainLive = program.pipe(
  Effect.provide(Layer.merge(ProducerLive, ConsumerLive)),
  Effect.provide(KafkaLive)
);

NodeRuntime.runMain(MainLive);
```
:::


## Step 4: Run the program

Now, we can run our `effect-kafka` program:

```sh
pnpm tsx main.ts
```