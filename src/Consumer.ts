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
    ): Effect.Effect<void, never, Exclude<R, ConsumerRecord.ConsumerRecord> | Scope.Scope>;
  };
  readonly runStream: {
    (path: MessageRouter.Route.Path): Stream.Stream<ConsumerRecord.ConsumerRecord, never, Scope.Scope>;
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
  export interface ConsumerOptions extends KafkaJS.ConsumerConfig {}
}

/**
 * @since 0.1.0
 * @category constructors
 */
export const make: (options: {
  readonly run: (app: MessageRouter.MessageRouter) => Effect.Effect<void, never, Scope.Scope>;
  readonly runStream?: (
    path: MessageRouter.Route.Path,
  ) => Stream.Stream<ConsumerRecord.ConsumerRecord, never, Scope.Scope>;
}) => Consumer = internal.make;

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

export const serveStream: (
  path: MessageRouter.Route.Path,
  options: Consumer.ConsumerOptions,
) => Stream.Stream<
  ConsumerRecord.ConsumerRecord,
  Error.ConnectionException,
  KafkaInstance.KafkaInstance | Scope.Scope
> = internal.serveStream;
