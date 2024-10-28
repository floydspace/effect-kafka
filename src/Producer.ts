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
  export type ProducerOptions = KafkaJS.ProducerConfig;

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
export const send: (
  record: Producer.ProducerRecord,
) => Effect.Effect<Producer.RecordMetadata[], Error.ConnectionException, KafkaInstance.KafkaInstance | Scope.Scope> =
  internal.send;

/**
 * @since 0.2.0
 * @category layers
 */
export const layer = (options?: Producer.ProducerOptions) => Layer.scoped(Producer, makeProducer(options));
