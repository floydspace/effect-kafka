/**
 * @since 0.2.0
 */
import { KafkaJS } from "@confluentinc/kafka-javascript";
import { Chunk, Effect, Layer, Runtime } from "effect";
import * as Consumer from "./Consumer";
import * as KafkaInstance from "./KafkaInstance";
import * as MessagePayload from "./MessagePayload";

class DefaultLogger implements KafkaJS.Logger {
  static create(runtime: Runtime.Runtime<never>): DefaultLogger {
    return new DefaultLogger(runtime);
  }

  private logLevel: KafkaJS.logLevel;
  private runSync: <A, E>(effect: Effect.Effect<A, E, never>) => A;

  private constructor(runtime: Runtime.Runtime<never>) {
    this.logLevel = KafkaJS.logLevel.INFO;
    this.runSync = Runtime.runSync(runtime);
  }

  setLogLevel(logLevel: KafkaJS.logLevel) {
    this.logLevel = logLevel;
  }

  info(message: string, extra?: object) {
    if (this.logLevel >= KafkaJS.logLevel.INFO) Effect.logInfo({ message, ...extra }).pipe(this.runSync);
  }

  error(message: string, extra?: object) {
    if (this.logLevel >= KafkaJS.logLevel.ERROR) Effect.logError({ message, ...extra }).pipe(this.runSync);
  }

  warn(message: string, extra?: object) {
    if (this.logLevel >= KafkaJS.logLevel.WARN) Effect.logWarning({ message, ...extra }).pipe(this.runSync);
  }

  debug(message: string, extra?: object) {
    if (this.logLevel >= KafkaJS.logLevel.DEBUG) Effect.logDebug({ message, ...extra }).pipe(this.runSync);
  }

  namespace() {
    return this;
  }
}

const makeLogger = Effect.map(Effect.runtime(), DefaultLogger.create);

/**
 * @since 0.2.0
 * @category constructors
 */
export const make = (config: KafkaJS.KafkaConfig): Effect.Effect<KafkaInstance.KafkaInstance> =>
  Effect.gen(function* () {
    const logger = yield* makeLogger;
    const kafka = new KafkaJS.Kafka({ kafkaJS: { ...config, logger } });

    return KafkaInstance.make({
      producer: () => Effect.never,
      consumer: (options) =>
        Effect.gen(function* () {
          const consumer = yield* Effect.acquireRelease(
            Effect.sync(() =>
              kafka.consumer({
                kafkaJS: { groupId: options.groupId },
              }),
            ).pipe(
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
