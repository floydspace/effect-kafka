/**
 * @since 0.1.0
 */
import type { KafkaJS } from "@confluentinc/kafka-javascript"; // TODO: use generic type
import { Context, Effect, Layer, Scope, Stream } from "effect";
import type * as Error from "./ConsumerError";
import type * as ConsumerRecord from "./ConsumerRecord";
import * as internal from "./internal/consumer";
import type * as KafkaInstance from "./KafkaInstance";
import type * as MessageRouter from "./MessageRouter";

/**
 * @since 0.1.0
 * @category type ids
 */
export const TypeId: unique symbol = internal.TypeId;

/**
 * @since 0.1.0
 * @category type ids
 */
export type TypeId = typeof TypeId;

/**
 * @since 0.1.0
 * @category models
 */
export interface Consumer {
  readonly [TypeId]: TypeId;
  readonly run: {
    <E, R>(
      app: MessageRouter.MessageRouter<E, R>,
    ): Effect.Effect<void, never, Exclude<R, ConsumerRecord.ConsumerRecord>>;
  };
  readonly runStream: {
    (path: MessageRouter.Route.Path): Stream.Stream<ConsumerRecord.ConsumerRecord>;
  };
}

/**
 * @since 0.1.0
 * @category constructors
 */
export const Consumer: Context.Tag<Consumer, Consumer> = internal.consumerTag;

/**
 * @since 0.2.0
 */
export declare namespace Consumer {
  /**
   * @since 0.2.0
   */
  export interface ConsumerOptions {
    /**
     * Client group id string. All clients sharing the same group.id belong to the same group.
     */
    groupId: string;
    metadataMaxAge?: number;
    sessionTimeout?: number;
    rebalanceTimeout?: number;
    heartbeatInterval?: number;
    /**
     * Initial maximum number of bytes per topic+partition to request when fetching messages from the broker. If the client encounters a message larger than this value it will gradually try to increase it until the entire message can be fetched.
     * In other words, it determines how many bytes can be fetched in one request from a single partition. There is a change in semantics, this size grows dynamically if a single message larger than this is encountered, and the client does not get stuck.
     *
     * @default 1048576
     */
    maxBytesPerPartition?: number;
    /**
     * Minimum number of bytes the broker responds with. If fetch.wait.max.ms expires the accumulated data will be sent to the client regardless of this setting.
     *
     * @default 1
     */
    minBytes?: number;
    /**
     * Maximum amount of data the broker shall return for a Fetch request. Messages are fetched in batches by the consumer and if the first message batch in the first non-empty partition of the Fetch request is larger than this value, then the message batch will still be returned to ensure the consumer can make progress. The maximum message batch size accepted by the broker is defined via `message.max.bytes` (broker config) or `max.message.bytes` (broker topic config). `fetch.max.bytes` is automatically adjusted upwards to be at least `message.max.bytes` (consumer config).
     *
     * @default 52428800
     */
    maxBytes?: number;
    maxWaitTimeInMs?: number;
    retry?: KafkaJS.RetryOptions;
    logLevel?: KafkaJS.logLevel;
    logger?: KafkaJS.Logger;
    allowAutoTopicCreation?: boolean;
    /**
     *  If true, consumer will read transactional messages which have not been committed.
     *
     * @default false
     */
    readUncommitted?: boolean;
    /**
     * If there is initial offset in offset store or the desired offset is out of range, and this is true, we consume the earliest possible offset.  **This is set on a per-consumer level, not on a per `subscribe` level**.
     *
     * @default false
     */
    fromBeginning?: boolean;
    /**
     * Automatically and periodically commit offsets in the background. Note: setting this to false does not prevent the consumer from fetching previously committed start offsets. To circumvent this behavior set specific start offsets per partition in the call to assign().
     *
     * @default true
     */
    autoCommit?: boolean;
    /**
     * The frequency in milliseconds that the consumer offsets are committed (written) to offset storage. (0 = disable). This setting is used by the high-level consumer.
     *
     * @default 5000
     */
    autoCommitInterval?: number;
    partitionAssigners?: KafkaJS.PartitionAssigners[];
    partitionAssignors?: KafkaJS.PartitionAssignors[];
  }
}

/**
 * @since 0.1.0
 * @category constructors
 */
export const make: (options: {
  readonly run: (app: MessageRouter.MessageRouter) => Effect.Effect<void>;
  readonly runStream: (path: MessageRouter.Route.Path) => Stream.Stream<ConsumerRecord.ConsumerRecord>;
}) => Consumer = internal.make;

/**
 * @since 0.3.1
 * @category constructors
 */
export const makeConsumer: (
  options: Consumer.ConsumerOptions,
) => Effect.Effect<Consumer, Error.ConnectionException, KafkaInstance.KafkaInstance | Scope.Scope> =
  internal.makeConsumer;

/**
 * @since 0.1.0
 * @category accessors
 */
export const serve: {
  /**
   * @since 0.1.0
   * @category accessors
   */
  (
    options: Consumer.ConsumerOptions,
  ): <E, R>(
    app: MessageRouter.MessageRouter<E, R>,
  ) => Layer.Layer<
    never,
    Error.ConnectionException,
    KafkaInstance.KafkaInstance | Exclude<R, ConsumerRecord.ConsumerRecord | Scope.Scope>
  >;
  /**
   * @since 0.1.0
   * @category accessors
   */
  <E, R>(
    app: MessageRouter.MessageRouter<E, R>,
    options: Consumer.ConsumerOptions,
  ): Layer.Layer<
    never,
    Error.ConnectionException,
    KafkaInstance.KafkaInstance | Exclude<R, ConsumerRecord.ConsumerRecord | Scope.Scope>
  >;
} = internal.serve;

/**
 * @since 0.1.0
 * @category accessors
 */
export const serveEffect: {
  /**
   * @since 0.1.0
   * @category accessors
   */
  (
    options: Consumer.ConsumerOptions,
  ): <E, R>(
    app: MessageRouter.MessageRouter<E, R>,
  ) => Effect.Effect<
    void,
    Error.ConnectionException,
    Scope.Scope | KafkaInstance.KafkaInstance | Exclude<R, ConsumerRecord.ConsumerRecord>
  >;
  /**
   * @since 0.1.0
   * @category accessors
   */
  <E, R>(
    app: MessageRouter.MessageRouter<E, R>,
    options: Consumer.ConsumerOptions,
  ): Effect.Effect<
    void,
    Error.ConnectionException,
    Scope.Scope | KafkaInstance.KafkaInstance | Exclude<R, ConsumerRecord.ConsumerRecord>
  >;
} = internal.serveEffect;

/**
 * @since 0.3.0
 * @category accessors
 */
export const serveStream: (
  path: MessageRouter.Route.Path,
) => Stream.Stream<ConsumerRecord.ConsumerRecord, never, Consumer> = internal.serveStream;

/**
 * @since 0.3.1
 * @category layers
 */
export const layer = (options: Consumer.ConsumerOptions) => Layer.scoped(Consumer, makeConsumer(options));
