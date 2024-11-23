import { Effect, Layer, Queue } from "effect";
import { Consumer, ConsumerRecord, MessageRouter, Producer } from "../../src";
import { ProducerConstructorProps } from "../../src/internal/producer";
import * as KafkaInstance from "../../src/KafkaInstance";

type Connectable = {
  connect: () => Effect.Effect<void>;
  disconnect: () => Effect.Effect<void>;
};

export interface TestProducer extends ProducerConstructorProps, Connectable {}

export interface TestConsumer extends Connectable {
  readonly subscribe: (topics: MessageRouter.Route.Path[]) => Effect.Effect<void>;
  readonly results: ConsumerRecord.ConsumerRecord[];
}

export interface TestInstance {
  readonly producer: () => TestProducer;
  readonly consumer: () => TestConsumer;
}

export const testKafkaInstanceLayer = (kafka: TestInstance) =>
  Layer.succeed(
    KafkaInstance.KafkaInstance,
    KafkaInstance.make({
      producer: () =>
        Effect.gen(function* () {
          const producer = yield* Effect.acquireRelease(
            Effect.sync(() => kafka.producer()).pipe(Effect.tap((p) => p.connect())),
            (p) => p.disconnect(),
          );

          return Producer.make({
            send: (record) => producer.send(record),
            sendBatch: (batch) => producer.sendBatch(batch),
          });
        }),
      consumer: () =>
        Effect.gen(function* () {
          const consumer = yield* Effect.acquireRelease(
            Effect.sync(() => kafka.consumer()).pipe(Effect.tap((p) => p.connect())),
            (p) => p.disconnect(),
          );

          return Consumer.make({
            subscribe: (topics) => consumer.subscribe(topics),
            consume: () =>
              Effect.gen(function* () {
                const queue = yield* Queue.unbounded<ConsumerRecord.ConsumerRecord>();

                yield* Queue.offerAll(queue, consumer.results);

                return queue;
              }),
          });
        }),
    }),
  );
