import { Cause, Effect, Runtime, Scope } from "effect";
import type {
  Consumer,
  ConsumerConfig,
  ConsumerRunConfig,
  ConsumerSubscribeTopics,
  LogEntry,
  Producer,
  ProducerBatch,
  ProducerConfig,
  ProducerRecord,
  RecordMetadata,
} from "kafkajs";
import { Kafka, logLevel } from "kafkajs";
import * as Error from "../../KafkaError.js";
import * as ProducerError from "../../ProducerError.js";
import { isKafkaJSError, KafkaJSConnectionError, KafkaJSNonRetriableError } from "../KafkaJSErrors.js";

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
export const send = (
  producer: Producer,
  record: ProducerRecord,
): Effect.Effect<RecordMetadata[], ProducerError.UnknownProducerError> =>
  Effect.tryPromise({
    try: () => producer.send(record),
    catch: (err) => {
      if (err instanceof KafkaJSNonRetriableError && isKafkaJSError(err.cause)) {
        return err.cause;
      }
      return isKafkaJSError(err) ? err : new Cause.UnknownException(err);
    },
  }).pipe(Effect.catchAll((err) => new ProducerError.UnknownProducerError(err)));

/** @internal */
export const sendBatch = (
  producer: Producer,
  batch: ProducerBatch,
): Effect.Effect<RecordMetadata[], ProducerError.UnknownProducerError> =>
  Effect.tryPromise({
    try: () => producer.sendBatch(batch),
    catch: (err) => {
      if (err instanceof KafkaJSNonRetriableError && isKafkaJSError(err.cause)) {
        return err.cause;
      }
      return isKafkaJSError(err) ? err : new Cause.UnknownException(err);
    },
  }).pipe(Effect.catchAll((err) => new ProducerError.UnknownProducerError(err)));

/** @internal */
export const subscribe = (consumer: Consumer, subscription: ConsumerSubscribeTopics): Effect.Effect<void> =>
  Effect.promise(() => consumer.subscribe(subscription));

/** @internal */
export const consume = (consumer: Consumer, config: ConsumerRunConfig): Effect.Effect<void> =>
  Effect.promise(() => consumer.run(config));

/** @internal */
export const connectProducerScoped = (
  kafka: Kafka,
  options?: ProducerConfig,
): Effect.Effect<Producer, Error.ConnectionException, Scope.Scope> =>
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
export const connectConsumerScoped = (
  kafka: Kafka,
  options: ConsumerConfig,
): Effect.Effect<Consumer, Error.ConnectionException, Scope.Scope> =>
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
