/**
 * @since 0.2.0
 */
import { Chunk, Effect, Layer, Runtime } from "effect";
import { EachMessageHandler, EachMessagePayload, Kafka, KafkaConfig, LogEntry, logLevel } from "kafkajs";
import * as Consumer from "./Consumer";
import * as KafkaInstance from "./KafkaInstance";
import * as MessagePayload from "./MessagePayload";

const makeLogger = Effect.map(Effect.runtime(), (runtime) => {
  const runSync = Runtime.runSync(runtime);

  return (entry: LogEntry) => {
    const prefix = entry.namespace ? `[${entry.namespace}] ` : "";
    const message = JSON.stringify(
      Object.assign({ level: entry.label }, entry.log, {
        message: `${prefix}${entry.log.message}`,
      }),
    );

    switch (entry.level) {
      case logLevel.INFO:
        return Effect.logInfo(message).pipe(runSync);
      case logLevel.ERROR:
        return Effect.logError(message).pipe(runSync);
      case logLevel.WARN:
        return Effect.logWarning(message).pipe(runSync);
      case logLevel.DEBUG:
        return Effect.logDebug(message).pipe(runSync);
    }
  };
});

/**
 * @since 0.2.0
 * @category constructors
 */
export const make = (config: KafkaConfig): Effect.Effect<KafkaInstance.KafkaInstance> =>
  Effect.gen(function* () {
    const logger = yield* makeLogger;
    const kafka = new Kafka({ ...config, logCreator: () => logger });

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

                const eachMessage: EachMessageHandler = yield* Effect.map(Effect.runtime(), (runtime) => {
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
