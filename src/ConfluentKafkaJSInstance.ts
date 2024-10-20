/**
 * @since 0.2.0
 */
import { KafkaJS } from "@confluentinc/kafka-javascript";
import { Chunk, Effect, Layer, Runtime } from "effect";
import * as Consumer from "./Consumer";
import * as Error from "./ConsumerError";
import * as internal from "./internal/confluentKafkaJSInstance";
import * as KafkaInstance from "./KafkaInstance";
import * as MessagePayload from "./MessagePayload";
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

                const eachMessage: KafkaJS.EachMessageHandler = yield* Effect.map(
                  Effect.runtime<never>(),
                  (runtime) => {
                    const runPromise = Runtime.runPromise(runtime);
                    return (payload: KafkaJS.EachMessagePayload) =>
                      app.pipe(
                        Effect.provideService(MessagePayload.MessagePayload, MessagePayload.make(payload)),
                        runPromise,
                      );
                  },
                );

                yield* Effect.promise(() => consumer.run({ eachMessage }));
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
