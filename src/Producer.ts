/**
 * @since 0.2.0
 */
import type { KafkaJS } from "@confluentinc/kafka-javascript"; // TODO: use generic type
import { Context, Effect, FiberRef, Layer, Scope } from "effect";
import type * as Error from "./ConsumerError";
import * as internal from "./internal/producer";
import type * as KafkaInstance from "./KafkaInstance";

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
    transactionalId?: string;
    transactionTimeout?: number;
    maxInFlightRequests?: number;
    acks?: number;
    compression?: KafkaJS.CompressionTypes;
    timeout?: number;
    retry?: KafkaJS.RetryOptions;
    logLevel?: KafkaJS.logLevel;
    logger?: KafkaJS.Logger;

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
   * @since 0.2.0
   */
  export type ProducerRecord = KafkaJS.ProducerRecord;

  /**
   * @since 0.2.0
   */
  export type ProducerBatch = KafkaJS.ProducerBatch;

  /**
   * @since 0.2.0
   */
  export type RecordMetadata = KafkaJS.RecordMetadata;
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
export const send: (record: Producer.ProducerRecord) => Effect.Effect<Producer.RecordMetadata[], never, Producer> =
  internal.send;

/**
 * @since 0.4.0
 * @category accessors
 */
export const sendScoped: (
  record: Producer.ProducerRecord,
) => Effect.Effect<Producer.RecordMetadata[], Error.ConnectionException, KafkaInstance.KafkaInstance | Scope.Scope> =
  internal.sendScoped;

/**
 * @since 0.2.0
 * @category layers
 */
export const layer = (options?: Producer.ProducerOptions) => Layer.scoped(Producer, makeProducer(options));
