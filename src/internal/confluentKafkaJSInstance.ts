import { KafkaJS } from "@confluentinc/kafka-javascript";
import { Cause, Effect, Runtime } from "effect";
import { LibrdKafkaError, isLibrdKafkaError } from "../ConfluentRdKafkaErrors";
import * as Error from "../ConsumerError";

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
): Effect.Effect<void, LibrdKafkaError | Cause.UnknownException> =>
  Effect.tryPromise({
    try: () => client.connect(),
    catch: (err) => (isLibrdKafkaError(err) ? new LibrdKafkaError(err) : new Cause.UnknownException(err)),
  });

/** @internal */
export const disconnect = <Client extends KafkaJS.Consumer | KafkaJS.Producer>(client: Client): Effect.Effect<void> =>
  Effect.promise(() => client.disconnect());

/** @internal */
export const acquireProducer = (kafka: KafkaJS.Kafka, config?: KafkaJS.ProducerConfig) =>
  Effect.acquireRelease(
    Effect.sync(() => kafka.producer({ kafkaJS: config })).pipe(
      Effect.tap(connect),
      Effect.catchTags({
        LibrdKafkaError: (err) =>
          err.message === "broker transport failure"
            ? new Error.ConnectionException({ broker: err.origin, message: err.message, stack: err.stack })
            : Effect.die(err),
        UnknownException: Effect.die,
      }),
    ),
    disconnect,
  );

/** @internal */
export const acquireConsumer = (kafka: KafkaJS.Kafka, config: KafkaJS.ConsumerConfig) =>
  Effect.acquireRelease(
    Effect.sync(() => kafka.consumer({ kafkaJS: config })).pipe(
      Effect.tap(connect),
      Effect.catchTags({
        LibrdKafkaError: (err) =>
          err.message === "broker transport failure"
            ? new Error.ConnectionException({ broker: err.origin, message: err.message, stack: err.stack })
            : Effect.die(err),
        UnknownException: Effect.die,
      }),
    ),
    disconnect,
  );
