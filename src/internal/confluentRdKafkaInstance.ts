import type {
  Client,
  ClientMetrics,
  ConsumerGlobalConfig,
  Metadata,
  MetadataOptions,
  ProducerGlobalConfig,
  SubscribeTopicList,
} from "@confluentinc/kafka-javascript";
import { CODES, KafkaConsumer, Producer as KafkaProducer } from "@confluentinc/kafka-javascript";
import { Effect } from "effect";
import { LibrdKafkaError } from "../ConfluentRdKafkaErrors";
import * as Error from "../ConsumerError";

/** @internal */
export type ConsumerHandler = Parameters<Client<"data">["on"]>["1"];

/** @internal */
export const connect = <Events extends string>(
  client: Client<Events>,
  metadataOptions?: MetadataOptions,
): Effect.Effect<Metadata, LibrdKafkaError> =>
  Effect.async<Metadata, LibrdKafkaError>((resume) => {
    client.connect(metadataOptions, (err, data) =>
      err ? resume(new LibrdKafkaError(err)) : resume(Effect.succeed(data)),
    );
  });

/** @internal */
export const disconnect = <Events extends string>(client: Client<Events>) =>
  Effect.async<ClientMetrics, LibrdKafkaError>((resume) => {
    client.disconnect((err, data) => (err ? resume(new LibrdKafkaError(err)) : resume(Effect.succeed(data))));
  });

/** @internal */
export const subscribeScoped = (consumer: KafkaConsumer, topics: SubscribeTopicList) =>
  Effect.acquireRelease(
    Effect.sync(() => consumer.subscribe(topics)).pipe(
      Effect.tap(() => Effect.logInfo("Consumer subscribed", { timestamp: new Date().toISOString() })),
    ),
    (c) =>
      Effect.sync(() => c.unsubscribe()).pipe(
        Effect.tap(() => Effect.logInfo("Consumer unsubscribed", { timestamp: new Date().toISOString() })),
      ),
  ).pipe(Effect.annotateLogs({ topics }));

/** @internal */
export const consume = (consumer: KafkaConsumer, config: { eachMessage: ConsumerHandler }) =>
  Effect.sync(() => consumer.on("data", config.eachMessage)).pipe(
    Effect.tap(() => Effect.sync(() => consumer.consume())),
  );

/** @internal */
export const connectProducerScoped = (config: ProducerGlobalConfig) =>
  Effect.acquireRelease(
    Effect.sync(() => new KafkaProducer(config)).pipe(
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
export const connectConsumerScoped = (config: ConsumerGlobalConfig) =>
  Effect.acquireRelease(
    Effect.sync(() => new KafkaConsumer(config)).pipe(
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
