/**
 * @since 0.1.0
 */
import { Context, Effect, Layer, Scope } from "effect";
import type { ConsumerConfig } from "kafkajs"; // TODO: use generic type
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
  export type ConsumerOptions = ConsumerConfig;
}

/**
 * @since 0.1.0
 * @category constructors
 */
export const make: (options: { readonly run: (app: MessageRouter.MessageRouter) => Effect.Effect<void> }) => Consumer =
  internal.make;

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
    options: ConsumerConfig,
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
    options: ConsumerConfig,
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
    options: ConsumerConfig,
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
    options: ConsumerConfig,
  ): Effect.Effect<
    void,
    Error.ConnectionException,
    Scope.Scope | KafkaInstance.KafkaInstance | Exclude<R, ConsumerRecord.ConsumerRecord>
  >;
} = internal.serveEffect;
