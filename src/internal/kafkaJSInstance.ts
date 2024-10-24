import { Cause, Effect, Runtime } from "effect";
import type { Consumer, ConsumerConfig, LogEntry, Producer, ProducerConfig } from "kafkajs";
import { Kafka, logLevel } from "kafkajs";
import * as Error from "../ConsumerError";
import { KafkaJSConnectionError, KafkaJSNonRetriableError } from "../KafkaJSErrors";

/** @internal */
export const makeLogger = Effect.map(Effect.runtime(), (runtime) => {
  const runSync = Runtime.runSync(runtime);

  return (entry: LogEntry) => {
    const prefix = entry.namespace ? `[${entry.namespace}] ` : "";
    const message = `${prefix}${entry.log.message}`;

    switch (entry.level) {
      case logLevel.INFO:
        return Effect.logInfo(message, entry.log).pipe(runSync);
      case logLevel.ERROR:
        return Effect.logError(message, entry.log).pipe(runSync);
      case logLevel.WARN:
        return Effect.logWarning(message, entry.log).pipe(runSync);
      case logLevel.DEBUG:
        return Effect.logDebug(message, entry.log).pipe(runSync);
    }
  };
});

/** @internal */
export const connect = <Client extends Consumer | Producer>(
  client: Client,
): Effect.Effect<void, KafkaJSConnectionError | Cause.UnknownException> =>
  Effect.tryPromise({
    try: () => client.connect(),
    catch: (err) => {
      if (err instanceof KafkaJSNonRetriableError) {
        return err.cause as KafkaJSConnectionError;
      }

      return new Cause.UnknownException(err);
    },
  });

/** @internal */
export const disconnect = <Client extends Consumer | Producer>(client: Client): Effect.Effect<void> =>
  Effect.promise(() => client.disconnect());

/** @internal */
export const acquireProducer = (kafka: Kafka, options?: ProducerConfig) =>
  Effect.acquireRelease(
    Effect.sync(() => kafka.producer(options)).pipe(
      Effect.tap(connect),
      Effect.catchTags({
        KafkaJSConnectionError: (err) => new Error.ConnectionException(err),
        UnknownException: Effect.die,
      }),
    ),
    disconnect,
  );

/** @internal */
export const acquireConsumer = (kafka: Kafka, options: ConsumerConfig) =>
  Effect.acquireRelease(
    Effect.sync(() => kafka.consumer(options)).pipe(
      Effect.tap(connect),
      Effect.catchTags({
        KafkaJSConnectionError: (err) => new Error.ConnectionException(err),
        UnknownException: Effect.die,
      }),
    ),
    disconnect,
  );
