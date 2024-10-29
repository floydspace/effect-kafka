/**
 * @since 0.2.0
 */
import { Chunk, Effect, Fiber, Layer, Queue, Stream } from "effect";
import { EachBatchHandler, Kafka, KafkaConfig, logLevel } from "kafkajs";
import * as Consumer from "./Consumer";
import * as ConsumerRecord from "./ConsumerRecord";
import * as internal from "./internal/kafkaJSInstance";
import * as KafkaInstance from "./KafkaInstance";
import type * as MessageRouter from "./MessageRouter";
import * as Producer from "./Producer";

/**
 * @since 0.2.0
 * @category constructors
 */
export const make = (config: KafkaConfig): Effect.Effect<KafkaInstance.KafkaInstance> =>
  Effect.gen(function* () {
    const logger = yield* internal.makeLogger;
    const kafka = new Kafka({ ...config, logCreator: () => logger, logLevel: logLevel.DEBUG });

    return KafkaInstance.make({
      producer: (options) =>
        Effect.gen(function* () {
          const producer = yield* internal.connectProducerScoped(kafka, options);

          return Producer.make({
            send: (record) => internal.send(producer, record),
            sendBatch: (batch) => internal.sendBatch(producer, batch),
          });
        }),
      consumer: ({ autoCommit, partitionAssigners: _, fromBeginning, ...options }) =>
        Effect.gen(function* () {
          const consumer = yield* internal.connectConsumerScoped(kafka, options);

          const subscribeAndConsume = (topics: MessageRouter.Route.Path[]) =>
            Effect.gen(function* () {
              yield* internal.subscribe(consumer, { topics, fromBeginning });

              const queue = yield* Queue.bounded<ConsumerRecord.ConsumerRecord>(1);

              const eachBatch: EachBatchHandler = async (payload) => {
                payload.batch.messages.forEach((message) => {
                  Queue.unsafeOffer(
                    queue,
                    ConsumerRecord.make({
                      topic: payload.batch.topic,
                      partition: payload.batch.partition,
                      highWatermark: payload.batch.highWatermark,
                      key: message.key,
                      value: message.value,
                      timestamp: message.timestamp,
                      attributes: message.attributes,
                      offset: message.offset,
                      headers: message.headers,
                      size: message.size,
                      heartbeat: () => Effect.promise(() => payload.heartbeat()),
                      commit: () => Effect.promise(() => payload.commitOffsetsIfNecessary()),
                    }),
                  );
                });
              };

              yield* internal.consume(consumer, { eachBatch, autoCommit });

              return queue;
            });

          return Consumer.make({
            run: (app) =>
              Effect.gen(function* () {
                const topics = Chunk.toArray(app.routes).map((route) => route.topic);

                const queue = yield* subscribeAndConsume(topics);

                const fiber = yield* app.pipe(
                  Effect.provideServiceEffect(ConsumerRecord.ConsumerRecord, Queue.take(queue)),
                  Effect.forever,
                  Effect.fork,
                );

                yield* Fiber.join(fiber);
              }),
            runStream: (topic) => subscribeAndConsume([topic]).pipe(Effect.map(Stream.fromQueue), Stream.flatten()),
          });
        }),
    });
  });

/**
 * @since 0.2.0
 * @category layers
 */
export const layer = (config: KafkaConfig) => Layer.effect(KafkaInstance.KafkaInstance, make(config));
