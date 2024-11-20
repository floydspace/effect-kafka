/**
 * @since 0.2.0
 */
import { KafkaJS } from "@confluentinc/kafka-javascript";
import { Chunk, Config, Effect, Fiber, Layer, Queue, Runtime, Stream } from "effect";
import * as Consumer from "../Consumer";
import * as ConsumerRecord from "../ConsumerRecord";
import * as KafkaInstance from "../KafkaInstance";
import type * as MessageRouter from "../MessageRouter";
import * as Producer from "../Producer";
import * as internal from "./internal/confluentKafkaJSInstance";

/**
 * @since 0.2.0
 * @category constructors
 */
export const make = (config: KafkaJS.KafkaConfig): Effect.Effect<KafkaInstance.KafkaInstance> =>
  Effect.gen(function* () {
    const logger = yield* internal.makeLogger;
    const kafka = new KafkaJS.Kafka({ kafkaJS: { ...config, logger, logLevel: KafkaJS.logLevel.DEBUG } });

    return KafkaInstance.make({
      producer: (options) =>
        Effect.gen(function* () {
          const producer = yield* internal.connectProducerScoped(kafka, options as KafkaJS.ProducerConfig);

          return Producer.make({
            send: (record) => internal.send(producer, record),
            sendBatch: (batch) => internal.sendBatch(producer, batch),
          });
        }),
      consumer: (options) =>
        Effect.gen(function* () {
          const consumer = yield* internal.connectConsumerScoped(kafka, options as KafkaJS.ConsumerConfig);

          const subscribeAndConsume = (topics: MessageRouter.Route.Path[]) =>
            Effect.gen(function* () {
              const runtime = yield* Effect.runtime();

              yield* internal.subscribe(consumer, { topics });

              const queue = yield* Queue.bounded<ConsumerRecord.ConsumerRecord>(1);

              const eachBatch: KafkaJS.EachBatchHandler = async (payload) => {
                await Queue.offerAll(
                  queue,
                  payload.batch.messages.map((message) =>
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
                  ),
                ).pipe(Runtime.runPromise(runtime));
              };

              yield* internal.consume(consumer, { eachBatch });

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
export const layer = (config: KafkaJS.KafkaConfig) => Layer.effect(KafkaInstance.KafkaInstance, make(config));

/**
 * @since 0.4.1
 * @category layers
 */
export const layerConfig = (config: Config.Config.Wrap<KafkaJS.KafkaConfig>) =>
  Layer.effect(KafkaInstance.KafkaInstance, Config.unwrap(config).pipe(Effect.flatMap(make)));
