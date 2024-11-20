/**
 * @since 0.1.0
 */
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
    /**
     * Period of time in milliseconds at which topic and broker metadata is refreshed in order to proactively discover any new brokers, topics, partitions or partition leader changes. Use -1 to disable the intervalled refresh (not recommended). If there are no locally referenced topics (no topic objects created, no messages produced, no subscription or no assignment) then only the broker list will be refreshed every interval but no more often than every 10s.
     *
     * @default 300000
     */
    metadataMaxAge?: number;
    /**
     * Client group session and failure detection timeout. The consumer sends periodic heartbeats (heartbeat.interval.ms) to indicate its liveness to the broker. If no hearts are received by the broker for a group member within the session timeout, the broker will remove the consumer from the group and trigger a rebalance. The allowed range is configured with the **broker** configuration properties `group.min.session.timeout.ms` and `group.max.session.timeout.ms`. Also see `max.poll.interval.ms`.
     *
     * @default 30000
     */
    sessionTimeout?: number;
    /**
     * Maximum allowed time between calls to consume messages (e.g., rd_kafka_consumer_poll()) for high-level consumers. If this interval is exceeded the consumer is considered failed and the group will rebalance in order to reassign the partitions to another consumer group member. Warning: Offset commits may be not possible at this point. Note: It is recommended to set `enable.auto.offset.store=false` for long-time processing applications and then explicitly store offsets (using offsets_store()) *after* message processing, to make sure offsets are not auto-committed prior to processing has finished. The interval is checked two times per second. See KIP-62 for more information.
     *
     * @default 300000
     */
    rebalanceTimeout?: number;
    /**
     * Group session keepalive heartbeat interval.
     *
     * @default 3000
     */
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
    /**
     * Maximum time the broker may wait to fill the Fetch response with fetch.min.bytes of messages.
     *
     * @default 5000
     */
    maxWaitTimeInMs?: number;
    retry?: {
      maxRetryTime?: number;
      initialRetryTime?: number;
      retries?: number;
    };
    /**
     * Allow automatic topic creation on the broker when subscribing to or assigning non-existent topics.
     *
     * @default true
     */
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
    /**
     * The name of one or more partition assignment strategies. The elected group leader will use a strategy supported by all members of the group to assign partitions to group members. If there is more than one eligible strategy, preference is determined by the order of this list (strategies earlier in the list have higher priority). Cooperative and non-cooperative (eager) strategies must not be mixed. Available strategies: range, roundrobin, cooperative-sticky.
     *
     * @default roundrobin
     */
    partitionAssigners?: ("roundrobin" | "range" | "cooperative-sticky")[];
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
