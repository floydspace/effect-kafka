/**
 * @since 0.2.0
 */
import { Context, Effect, Scope } from "effect";
import * as Consumer from "./Consumer";
import * as internal from "./internal/kafkaInstance";
import * as Producer from "./Producer";

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
    (options: Producer.Producer.ProducerOptions): Effect.Effect<never>;
  };
  readonly consumer: {
    (options: Consumer.Consumer.ConsumerOptions): Effect.Effect<Consumer.Consumer>;
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
    (options: Producer.Producer.ProducerOptions): Effect.Effect<never, never, Scope.Scope>;
  };
  readonly consumer: {
    (options: Consumer.Consumer.ConsumerOptions): Effect.Effect<Consumer.Consumer, never, Scope.Scope>;
  };
}) => KafkaInstance = internal.make;
