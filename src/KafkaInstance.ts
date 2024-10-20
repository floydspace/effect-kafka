/**
 * @since 0.2.0
 */
import { Context, Effect, Scope } from "effect";
import { Consumer } from "./Consumer";
import type * as Error from "./ConsumerError";
import * as internal from "./internal/kafkaInstance";
import { Producer } from "./Producer";

/**
 * @since 0.2.0
 * @category type ids
 */
export const TypeId: unique symbol = internal.TypeId;

/**
 * @since 0.2.0
 * @category type ids
 */
export type TypeId = typeof TypeId;

/**
 * @since 0.2.0
 * @category models
 */
export interface KafkaInstance {
  readonly [TypeId]: TypeId;
  readonly producer: {
    (options?: Producer.ProducerOptions): Effect.Effect<Producer, Error.ConnectionException, Scope.Scope>;
  };
  readonly consumer: {
    (options: Consumer.ConsumerOptions): Effect.Effect<Consumer, Error.ConnectionException, Scope.Scope>;
  };
}

/**
 * @since 0.2.0
 * @category constructors
 */
export const KafkaInstance: Context.Tag<KafkaInstance, KafkaInstance> = internal.instanceTag;

/**
 * @since 0.2.0
 * @category constructors
 */
export const make: (options: {
  readonly producer: {
    (options?: Producer.ProducerOptions): Effect.Effect<Producer, Error.ConnectionException, Scope.Scope>;
  };
  readonly consumer: {
    (options: Consumer.ConsumerOptions): Effect.Effect<Consumer, Error.ConnectionException, Scope.Scope>;
  };
}) => KafkaInstance = internal.make;
