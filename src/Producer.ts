/**
 * @since 0.2.0
 */
import { Context, Effect, FiberRef, Layer, Scope } from "effect";
import * as internal from "./internal/producer.js";
import type * as Error from "./KafkaError.js";
import type * as KafkaInstance from "./KafkaInstance.js";
import type * as ProducerError from "./ProducerError.js";

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
export interface Producer extends internal.ProducerConstructorProps {
  readonly [TypeId]: TypeId;
}

/**
 * @since 0.1.0
 * @category constructors
 */
export const Producer: Context.Tag<Producer, Producer> = internal.producerTag;

/**
 * @since 0.2.0
 */
export declare namespace Producer {
  /**
   * @since 0.2.0
   */
  export interface ProducerOptions {
    /**
     * Period of time in milliseconds at which topic and broker metadata is refreshed in order to proactively discover any new brokers, topics, partitions or partition leader changes. Use -1 to disable the intervalled refresh (not recommended). If there are no locally referenced topics (no topic objects created, no messages produced, no subscription or no assignment) then only the broker list will be refreshed every interval but no more often than every 10s.
     *
     * @default 300000
     */
    metadataMaxAge?: number;
    /**
     * Allow automatic topic creation on the broker when subscribing to or assigning non-existent topics. The broker must also be configured with `auto.create.topics.enable=true` for this configuration to take effect. Note: the default value (true) for the producer is different from the default value (false) for the consumer. Further, the consumer default value is different from the Java consumer (true), and this property is not supported by the Java producer. Requires broker version >= 0.11.0.0, for older broker versions only the broker configuration applies.
     *
     * @default false
     */
    allowAutoTopicCreation?: boolean;
    /**
     * When set to `true`, the producer will ensure that messages are successfully produced exactly once and in the original produce order. The following configuration properties are adjusted automatically (if not modified by the user) when idempotence is enabled: `max.in.flight.requests.per.connection=5` (must be less than or equal to 5), `retries=INT32_MAX` (must be greater than 0), `acks=all`, `queuing.strategy=fifo`. Producer instantation will fail if user-supplied configuration is incompatible.
     *
     * @default false
     */
    idempotent?: boolean;
    /**
     * Enables the transactional producer. The transactional.id is used to identify the same transactional producer instance across process restarts. It allows the producer to guarantee that transactions corresponding to earlier instances of the same producer have been finalized prior to starting any new transactions, and that any zombie instances are fenced off. If no transactional.id is provided, then the producer is limited to idempotent delivery (if enable.idempotence is set). Requires broker version >= 0.11.0.
     */
    transactionalId?: string;
    /**
     * The maximum amount of time in milliseconds that the transaction coordinator will wait for a transaction status update from the producer before proactively aborting the ongoing transaction. If this value is larger than the `transaction.max.timeout.ms` setting in the broker, the init_transactions() call will fail with ERR_INVALID_TRANSACTION_TIMEOUT. The transaction timeout automatically adjusts `message.timeout.ms` and `socket.timeout.ms`, unless explicitly configured in which case they must not exceed the transaction timeout (`socket.timeout.ms` must be at least 100ms lower than `transaction.timeout.ms`). This is also the default timeout value if no timeout (-1) is supplied to the transactional API methods.
     *
     * @default 60000
     */
    transactionTimeout?: number;
    /**
     * Maximum number of in-flight requests per broker connection. This is a generic property applied to all broker communication, however it is primarily relevant to produce requests. In particular, note that other mechanisms limit the number of outstanding consumer fetch request per broker to one.
     *
     * @default 1000000
     */
    maxInFlightRequests?: number;
    /**
     * This field indicates the number of acknowledgements the leader broker must receive from ISR brokers before responding to the request: *0*=Broker does not send any response/ack to client, *-1* or *all*=Broker will block until message is committed by all in sync replicas (ISRs). If there are less than `min.insync.replicas` (broker configuration) in the ISR set the produce request will fail.
     * The number of required acks before a Produce succeeds. **This is set on a per-producer level, not on a per `send` level**. -1 denotes it will wait for all brokers in the in-sync replica set.
     *
     * @default -1
     */
    acks?: number;
    /**
     * compression codec to use for compressing message sets. This is the default value for all topics, may be overridden by the topic configuration property `compression.codec`.
     *
     * @default none
     */
    compression?: "none" | "gzip" | "snappy" | "lz4" | "zstd";
    /**
     * The ack timeout of the producer request in milliseconds. This value is only enforced by the broker and relies on `acks` being != 0.
     *
     * @default 30000
     */
    timeout?: number;
    retry?: {
      maxRetryTime?: number;
      initialRetryTime?: number;
      retries?: number;
    };

    // RdKafka specific options
    /**
     * Partitioner: `random` - random distribution, `consistent` - CRC32 hash of key (Empty and NULL keys are mapped to single partition), `consistent_random` - CRC32 hash of key (Empty and NULL keys are randomly partitioned), `murmur2` - Java Producer compatible Murmur2 hash of key (NULL keys are mapped to single partition), `murmur2_random` - Java Producer compatible Murmur2 hash of key (NULL keys are randomly partitioned. This is functionally equivalent to the default partitioner in the Java Producer.), `fnv1a` - FNV-1a hash of key (NULL keys are mapped to single partition), `fnv1a_random` - FNV-1a hash of key (NULL keys are randomly partitioned).
     *
     * @default murmur2_random
     */
    partitioner?:
      | "random"
      | "consistent_random"
      | "consistent"
      | "murmur2"
      | "murmur2_random"
      | "fnv1a"
      | "fnv1a_random";
    queueBuffering?: {
      /**
       * Maximum number of messages allowed on the producer queue. This queue is shared by all topics and partitions. A value of 0 disables this limit.
       *
       * @default 100000
       */
      maxMessages?: number;
      /**
       * Maximum total message size sum allowed on the producer queue. This queue is shared by all topics and partitions. This property has higher priority than `queueBuffering.maxMessages`.
       *
       * @default 1048576
       */
      maxKbytes?: number;
      /**
       * Delay in milliseconds to wait for messages in the producer queue to accumulate before constructing message batches to transmit to brokers. A higher value allows larger and more effective (less overhead, improved compression) batches of messages to accumulate at the expense of increased message delivery latency.
       *
       * @default 5
       */
      maxMs?: number;
    };
    batching?: {
      /**
       * Maximum number of messages batched in one MessageSet. The total MessageSet size is also limited by `batching.maxBytes` and `message.max.bytes`.
       *
       * @default 10000
       */
      maxMessages?: number;
      /**
       * Maximum size (in bytes) of all messages batched in one MessageSet, including protocol framing overhead. This limit is applied after the first message has been added to the batch, regardless of the first message's size, this is to ensure that messages that exceed batch.size are produced. The total MessageSet size is also limited by `batching.maxMessages` and `message.max.bytes`.
       *
       * @default 1000000
       */
      maxBytes?: number;
    };
    stickyPartitioning?: {
      /**
       * Delay in milliseconds to wait to assign new sticky partitions for each topic. By default, set to double the time of `queueBuffering.maxMs`. To disable sticky behavior, set to 0. This behavior affects messages with the key NULL in all cases, and messages with key lengths of zero when the consistent_random partitioner is in use. These messages would otherwise be assigned randomly. A higher value allows for more effective batching of these messages.
       *
       * @default 2 * queueBuffering.maxMs
       */
      lingerMs?: number;
    };
  }

  /**
   * @since 0.5.0
   */
  export type Message = {
    key?: Buffer | string | null;
    value: Buffer | string | null;
    partition?: number;
    headers?: {
      [key: string]: Buffer | string | (Buffer | string)[] | undefined;
    };
    opaque?: any;
    timestamp?: string;
  };

  /**
   * @since 0.2.0
   */
  export type ProducerRecord = {
    topic: string;
    messages: Message[];
  };

  /**
   * @since 0.2.0
   */
  export type ProducerBatch = {
    topicMessages?: ProducerRecord[];
  };

  /**
   * @since 0.2.0
   */
  export type RecordMetadata = {
    topicName: string;
    partition: number;
    errorCode: number;
    offset?: string;
    timestamp?: string;
    baseOffset?: string;
    logAppendTime?: string;
    logStartOffset?: string;
  };
}

/**
 * @since 0.2.0
 * @category producer options
 */
export const currentProducerOptions: FiberRef.FiberRef<Producer.ProducerOptions> = internal.currentProducerOptions;

/**
 * @since 0.2.0
 * @category producer options
 */
export const withProducerOptions: {
  /**
   * @since 0.2.0
   * @category producer options
   */
  (config: Producer.ProducerOptions): <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>;
  /**
   * @since 0.2.0
   * @category producer options
   */
  <A, E, R>(effect: Effect.Effect<A, E, R>, config: Producer.ProducerOptions): Effect.Effect<A, E, R>;
} = internal.withProducerOptions;

/**
 * @since 0.2.0
 * @category producer options
 */
export const setProducerOptions: (config: Producer.ProducerOptions) => Layer.Layer<never> = internal.setProducerOptions;

/**
 * @since 0.2.0
 * @category constructors
 */
export const make: (options: internal.ProducerConstructorProps) => Producer = internal.make;

/**
 * @since 0.2.0
 * @category constructors
 */
export const makeProducer: (
  options?: Producer.ProducerOptions,
) => Effect.Effect<Producer, Error.ConnectionException, KafkaInstance.KafkaInstance | Scope.Scope> =
  internal.makeProducer;

/**
 * @since 0.2.0
 * @category accessors
 */
export const send: (
  record: Producer.ProducerRecord,
) => Effect.Effect<Producer.RecordMetadata[], ProducerError.ProducerError, Producer> = internal.send;

/**
 * @since 0.4.0
 * @category accessors
 */
export const sendScoped: (
  record: Producer.ProducerRecord,
) => Effect.Effect<
  Producer.RecordMetadata[],
  Error.ConnectionException | ProducerError.ProducerError,
  KafkaInstance.KafkaInstance | Scope.Scope
> = internal.sendScoped;

/**
 * @since 0.2.0
 * @category layers
 */
export const layer = (options?: Producer.ProducerOptions) => Layer.scoped(Producer, makeProducer(options));
