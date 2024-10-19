import { KafkaJS } from "@confluentinc/kafka-javascript";
import { Cause, Effect, Runtime } from "effect";
import { LibrdKafkaError, isLibrdKafkaError } from "../ConfluentRdKafkaErrors";

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
export const connect = (consumer: KafkaJS.Consumer): Effect.Effect<void, LibrdKafkaError | Cause.UnknownException> =>
  Effect.tryPromise({
    try: () => consumer.connect(),
    catch: (err) => (isLibrdKafkaError(err) ? new LibrdKafkaError(err) : new Cause.UnknownException(err)),
  });

/** @internal */
export const disconnect = (consumer: KafkaJS.Consumer): Effect.Effect<void> =>
  Effect.promise(() => consumer.disconnect());
