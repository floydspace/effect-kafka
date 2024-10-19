import { Chunk, Effect, Layer, Runtime } from "effect";
import { EachMessageHandler, EachMessagePayload, Kafka, KafkaConfig, logCreator, logLevel } from "kafkajs";
import * as Consumer from "./Consumer";
import * as KafkaInstance from "./KafkaInstance";
import * as MessagePayload from "./MessagePayload";

/**
 * @since 0.2.0
 * @category constructors
 */
export const make = (config: KafkaConfig): Effect.Effect<KafkaInstance.KafkaInstance> =>
  Effect.gen(function* () {
    const LoggerEffect: logCreator =
      () =>
      ({ namespace, level, label, log }) => {
        const prefix = namespace ? `[${namespace}] ` : "";
        const message = JSON.stringify(
          Object.assign({ level: label }, log, {
            message: `${prefix}${log.message}`,
          }),
        );

        switch (level) {
          case logLevel.INFO:
            return console.info(message);
          case logLevel.ERROR:
            return console.error(message);
          case logLevel.WARN:
            return console.warn(message);
          case logLevel.DEBUG:
            return console.log(message);
        }
      };

    const kafka = new Kafka({ ...config, logCreator: LoggerEffect });

    return KafkaInstance.make({
      producer: () => Effect.never,
      consumer: (options) =>
        Effect.gen(function* () {
          const consumer = yield* Effect.acquireRelease(
            Effect.sync(() => kafka.consumer(options)).pipe(
              Effect.tap((c) => c.connect()),
              Effect.orDie,
            ),
            (c) => Effect.promise(() => c.disconnect()),
          );
          return Consumer.make({
            run: (app) =>
              Effect.gen(function* () {
                const topics = Chunk.toArray(app.routes).map((route) => route.topic);
                yield* Effect.promise(() => consumer.subscribe({ topics }));

                const eachMessage: EachMessageHandler = yield* Effect.map(Effect.runtime<never>(), (runtime) => {
                  const runPromise = Runtime.runPromise(runtime);
                  return (payload: EachMessagePayload) =>
                    app.pipe(
                      Effect.provideService(MessagePayload.MessagePayload, MessagePayload.make(payload)),
                      runPromise,
                    );
                });

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
export const layer = (config: KafkaConfig) => Layer.scoped(KafkaInstance.KafkaInstance, make(config));
