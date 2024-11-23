import type {
  Client,
  ClientMetrics,
  ConsumerGlobalConfig,
  ConsumerTopicConfig,
  Metadata,
  MetadataOptions,
  ProducerGlobalConfig,
  ProducerTopicConfig,
  SubscribeTopicList,
} from "@confluentinc/kafka-javascript";
import pkg from "@confluentinc/kafka-javascript";
import { Effect, Runtime, Scope } from "effect";
import * as Error from "../../KafkaError.js";
import { LibrdKafkaError } from "../ConfluentRdKafkaErrors.js";

const CODES = pkg.CODES;
const KafkaConsumer = pkg.KafkaConsumer;
type KafkaConsumer = pkg.KafkaConsumer;
const KafkaProducer = pkg.Producer;
type KafkaProducer = pkg.Producer;

/** @internal */
export type ConsumerHandler = Parameters<Client<"data">["on"]>["1"];

/** @internal */
export type LogEventData = {
  message: string;
  severity: number;
  fac: string;
  name: string;
};

/** @internal */
export type LoggingConfig = {
  logger: (eventData: LogEventData) => void;
};

/** @internal */
export type ProducerConfig = ProducerGlobalConfig & ProducerTopicConfig & LoggingConfig;

/** @internal */
export type ConsumerConfig = ConsumerGlobalConfig & ConsumerTopicConfig & LoggingConfig;

const tracingFacs = [
  "APIVERSION",
  "METADATA",
  "CONF",
  "FETCH",
  "SEND",
  "RECV",
  "HEARTBEAT",
  "OFFSET",
  "DUMP",
  "DUMP_ALL",
  "DUMP_PND",
  "DUMP_QRY",
  "DUMP_REM",
  "ASSIGN",
  "ASSIGNOR",
  "ASSIGNMENT",
  "ASSIGNDONE",
  "CLEARASSIGN",
  "GRPASSIGNMENT",
];

/** @internal */
export const makeLogger = Effect.map(Effect.runtime(), (runtime) => {
  const runSync = Runtime.runSync(runtime);

  return ({ message, severity, ...event }: LogEventData) => {
    const extra = { ...event, timestamp: Date.now() };
    if (severity >= 7) {
      if (tracingFacs.includes(event.fac)) {
        Effect.logTrace(message, extra).pipe(runSync);
      } else {
        Effect.logDebug(message, extra).pipe(runSync);
      }
    } else if (severity >= 6) {
      Effect.logInfo(message, extra).pipe(runSync);
    } else if (severity >= 4) {
      Effect.logWarning(message, extra).pipe(runSync);
    } else if (severity > 0) {
      Effect.logError(message, extra).pipe(runSync);
    }
  };
});

/** @internal */
export const connect = <Events extends string>(
  client: Client<Events>,
  metadataOptions?: MetadataOptions,
): Effect.Effect<Metadata, LibrdKafkaError> =>
  Effect.async((resume) => {
    client.connect(metadataOptions, (err, data) =>
      err ? resume(new LibrdKafkaError(err)) : resume(Effect.succeed(data)),
    );
  });

/** @internal */
export const disconnect = <Events extends string>(
  client: Client<Events>,
): Effect.Effect<ClientMetrics, LibrdKafkaError> =>
  Effect.async((resume) => {
    client.disconnect((err, data) => (err ? resume(new LibrdKafkaError(err)) : resume(Effect.succeed(data))));
  });

/** @internal */
export const subscribeScoped = (
  consumer: KafkaConsumer,
  topics: SubscribeTopicList,
): Effect.Effect<void, never, Scope.Scope> =>
  Effect.acquireRelease(
    Effect.sync(() => consumer.subscribe(topics)).pipe(
      Effect.tap(() => Effect.logInfo("Consumer subscribed", { timestamp: new Date().toISOString() })),
    ),
    (c) =>
      Effect.sync(() => c.unsubscribe()).pipe(
        Effect.tap(() => Effect.logInfo("Consumer unsubscribed", { timestamp: new Date().toISOString() })),
      ),
  ).pipe(Effect.asVoid, Effect.annotateLogs({ topics }));

/** @internal */
export const consume = (consumer: KafkaConsumer, config: { eachMessage: ConsumerHandler }): Effect.Effect<void> =>
  Effect.sync(() => consumer.on("data", config.eachMessage)).pipe(
    Effect.andThen(() => Effect.sync(() => consumer.consume())),
  );

/** @internal */
export const connectProducerScoped = ({
  logger,
  ...config
}: ProducerConfig): Effect.Effect<KafkaProducer, Error.ConnectionException, Scope.Scope> =>
  Effect.acquireRelease(
    Effect.sync(() => new KafkaProducer(config)).pipe(
      Effect.tap((p) => p.on("event.log", logger)),
      Effect.tap((p) => connect(p)),
      Effect.tap(() => Effect.logInfo("Producer connected", { timestamp: new Date().toISOString() })),
      Effect.catchTag("LibrdKafkaError", (err) =>
        err.code === CODES.ERRORS.ERR__TRANSPORT
          ? new Error.ConnectionException({ broker: err.origin, message: err.message, stack: err.stack })
          : Effect.die(err),
      ),
    ),
    (c) =>
      disconnect(c).pipe(
        Effect.tap(() => Effect.logInfo("Producer disconnected", { timestamp: new Date().toISOString() })),
        Effect.orDie,
      ),
  );

/** @internal */
export const connectConsumerScoped = ({
  logger,
  ...config
}: ConsumerConfig): Effect.Effect<KafkaConsumer, Error.ConnectionException, Scope.Scope> =>
  Effect.acquireRelease(
    Effect.sync(() => new KafkaConsumer(config)).pipe(
      Effect.tap((p) => p.on("event.log", logger)),
      Effect.tap((c) => connect(c)),
      Effect.tap(() => Effect.logInfo("Consumer connected", { timestamp: new Date().toISOString() })),
      Effect.catchTag("LibrdKafkaError", (err) =>
        err.code === CODES.ERRORS.ERR__TRANSPORT
          ? new Error.ConnectionException({ broker: err.origin, message: err.message, stack: err.stack })
          : Effect.die(err),
      ),
    ),
    (c) =>
      disconnect(c).pipe(
        Effect.tap(() => Effect.logInfo("Consumer disconnected", { timestamp: new Date().toISOString() })),
        Effect.orDie,
      ),
  ).pipe(Effect.annotateLogs({ groupId: config["group.id"] }));
