/**
 * @since 0.2.0
 */
import { KafkaJS } from "@confluentinc/kafka-javascript";
import { Chunk, Effect, Layer, Runtime } from "effect";
import * as Consumer from "./Consumer";
import * as Error from "./ConsumerError";
import * as ConsumerRecord from "./ConsumerRecord";
import * as internal from "./internal/confluentKafkaJSInstance";
import * as KafkaInstance from "./KafkaInstance";
import * as Producer from "./Producer";

/**
 * @since 0.2.0
 * @category constructors
 */
export const make = (config: KafkaJS.KafkaConfig): Effect.Effect<KafkaInstance.KafkaInstance> =>
  Effect.gen(function* () {
    const logger = yield* internal.makeLogger;
    const kafka = new KafkaJS.Kafka({ kafkaJS: { ...config, logger } });

    return KafkaInstance.make({
      producer: (options) =>
        Effect.gen(function* () {
          const producer = yield* Effect.acquireRelease(
            Effect.sync(() => kafka.producer({ kafkaJS: options })).pipe(
              Effect.tap(internal.connect),
              Effect.catchTags({
                LibrdKafkaError: (err) =>
                  err.message === "broker transport failure"
                    ? new Error.ConnectionException({ broker: err.origin, message: err.message, stack: err.stack })
                    : Effect.die(err),
                UnknownException: Effect.die,
              }),
            ),
            internal.disconnect,
          );

          return Producer.make({
            send: (record) => Effect.promise(() => producer.send(record)),
            sendBatch: (batch) => Effect.promise(() => producer.sendBatch(batch)),
          });
        }),
      consumer: (options) =>
        Effect.gen(function* () {
          const consumer = yield* Effect.acquireRelease(
            Effect.sync(() => kafka.consumer({ kafkaJS: { groupId: options.groupId } })).pipe(
              Effect.tap(internal.connect),
              Effect.catchTags({
                LibrdKafkaError: (err) =>
                  err.message === "broker transport failure"
                    ? new Error.ConnectionException({ broker: err.origin, message: err.message, stack: err.stack })
                    : Effect.die(err),
                UnknownException: Effect.die,
              }),
            ),
            internal.disconnect,
          );

          return Consumer.make({
            run: (app) =>
              Effect.gen(function* () {
                const topics = Chunk.toArray(app.routes).map((route) => route.topic);
                yield* Effect.promise(() => consumer.subscribe({ topics }));

                const eachBatch: KafkaJS.EachBatchHandler = yield* Effect.map(Effect.runtime(), (runtime) => {
                  const runPromise = Runtime.runPromise(runtime);
                  return (payload: KafkaJS.EachBatchPayload) =>
                    Effect.forEach(
                      payload.batch.messages,
                      (message) =>
                        app.pipe(
                          Effect.provideService(
                            ConsumerRecord.ConsumerRecord,
                            ConsumerRecord.make({
                              topic: payload.batch.topic,
                              partition: payload.batch.partition,
                              key: message.key,
                              value: message.value,
                              timestamp: message.timestamp,
                              attributes: message.attributes,
                              offset: message.offset,
                              headers: message.headers,
                              size: message.size,
                            }),
                          ),
                        ),
                      { discard: true },
                    ).pipe(runPromise);
                });

                yield* Effect.promise(() => consumer.run({ eachBatch }));
              }),
          });
        }),
    });
  });

/**
 * @since 0.2.0
 * @category layers
 */
export const layer = (config: KafkaJS.KafkaConfig) => Layer.scoped(KafkaInstance.KafkaInstance, make(config));
