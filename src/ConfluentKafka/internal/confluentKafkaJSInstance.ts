import { KafkaJS } from "@confluentinc/kafka-javascript";
import { Cause, Effect, Runtime, Scope } from "effect";
import * as Error from "../../KafkaError.js";
import * as ProducerError from "../../ProducerError.js";
import { isKafkaJSError } from "../ConfluentKafkaJSErrors.js";
import { isLibRdKafkaError, LibRdKafkaError } from "../ConfluentRdKafkaErrors.js";

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
    if (this.logLevel >= KafkaJS.logLevel.INFO) Effect.logInfo(message, extra).pipe(this.runSync);
  }

  error(message: string, extra?: object) {
    if (this.logLevel >= KafkaJS.logLevel.ERROR) Effect.logError(message, extra).pipe(this.runSync);
  }

  warn(message: string, extra?: object) {
    if (this.logLevel >= KafkaJS.logLevel.WARN) Effect.logWarning(message, extra).pipe(this.runSync);
  }

  debug(message: string, extra?: object) {
    if (this.logLevel >= KafkaJS.logLevel.DEBUG) Effect.logDebug(message, extra).pipe(this.runSync);
  }

  namespace() {
    return this;
  }
}

/** @internal */
export const makeLogger = Effect.map(Effect.runtime(), DefaultLogger.create);

/** @internal */
export const connect = <Client extends KafkaJS.Consumer | KafkaJS.Producer>(
  client: Client,
): Effect.Effect<void, LibRdKafkaError | Cause.UnknownException> =>
  Effect.tryPromise({
    try: () => client.connect(),
    catch: (err) => (isLibRdKafkaError(err) ? new LibRdKafkaError(err) : new Cause.UnknownException(err)),
  });

/** @internal */
export const disconnect = <Client extends KafkaJS.Consumer | KafkaJS.Producer>(client: Client): Effect.Effect<void> =>
  Effect.promise(() => client.disconnect());

/** @internal */
export const send = (
  producer: KafkaJS.Producer,
  record: KafkaJS.ProducerRecord,
): Effect.Effect<KafkaJS.RecordMetadata[], ProducerError.UnknownProducerError> =>
  Effect.tryPromise({
    try: () => producer.send(record),
    catch: (err) => (isKafkaJSError(err) ? err : new Cause.UnknownException(err)),
  }).pipe(Effect.catchAll((err) => new ProducerError.UnknownProducerError(err)));

/** @internal */
export const sendBatch = (
  producer: KafkaJS.Producer,
  batch: KafkaJS.ProducerBatch,
): Effect.Effect<KafkaJS.RecordMetadata[], ProducerError.UnknownProducerError> =>
  Effect.tryPromise({
    try: () => producer.sendBatch(batch),
    catch: (err) => (isKafkaJSError(err) ? err : new Cause.UnknownException(err)),
  }).pipe(Effect.catchAll((err) => new ProducerError.UnknownProducerError(err)));

/** @internal */
export const subscribe = (
  consumer: KafkaJS.Consumer,
  subscription: KafkaJS.ConsumerSubscribeTopics,
): Effect.Effect<void> => Effect.promise(() => consumer.subscribe(subscription));

/** @internal */
export const consume = (consumer: KafkaJS.Consumer, config: KafkaJS.ConsumerRunConfig): Effect.Effect<void> =>
  Effect.promise(() => consumer.run(config));

/** @internal */
export const connectProducerScoped = (
  kafka: KafkaJS.Kafka,
  config?: KafkaJS.ProducerConfig,
): Effect.Effect<KafkaJS.Producer, Error.ConnectionException, Scope.Scope> =>
  Effect.acquireRelease(
    Effect.sync(() => kafka.producer({ kafkaJS: config })).pipe(
      Effect.tap(connect),
      Effect.catchTags({
        LibRdKafkaError: (err) =>
          err.message === "broker transport failure"
            ? new Error.ConnectionException({ broker: err.origin, message: err.message, stack: err.stack })
            : Effect.die(err),
        UnknownException: Effect.die,
      }),
    ),
    disconnect,
  );

/** @internal */
export const connectConsumerScoped = (
  kafka: KafkaJS.Kafka,
  config: KafkaJS.ConsumerConfig,
): Effect.Effect<KafkaJS.Consumer, Error.ConnectionException, Scope.Scope> =>
  Effect.acquireRelease(
    Effect.sync(() => kafka.consumer({ kafkaJS: config })).pipe(
      Effect.tap(connect),
      Effect.catchTags({
        LibRdKafkaError: (err) =>
          err.message === "broker transport failure"
            ? new Error.ConnectionException({ broker: err.origin, message: err.message, stack: err.stack })
            : Effect.die(err),
        UnknownException: Effect.die,
      }),
    ),
    disconnect,
  );
