import { Context, Effect, Layer, Scope, Stream } from "effect";
import { dual } from "effect/Function";
import type * as Consumer from "../Consumer";
import type * as Error from "../ConsumerError";
import type * as ConsumerRecord from "../ConsumerRecord";
import * as KafkaInstance from "../KafkaInstance";
import type * as MessageRouter from "../MessageRouter";

/** @internal */
export const TypeId: Consumer.TypeId = Symbol.for("effect-kafka/Consumer") as Consumer.TypeId;

/** @internal */
export const consumerTag = Context.GenericTag<Consumer.Consumer>("effect-kafka/Consumer");

const consumerProto = {
  [TypeId]: TypeId,
};

/** @internal */
export const make = (options: {
  readonly run: (app: MessageRouter.MessageRouter) => Effect.Effect<void>;
  readonly runStream: (path: MessageRouter.Route.Path) => Stream.Stream<ConsumerRecord.ConsumerRecord>;
}): Consumer.Consumer => Object.assign(Object.create(consumerProto), options);

/** @internal */
export const makeConsumer = (
  options: Consumer.Consumer.ConsumerOptions,
): Effect.Effect<Consumer.Consumer, Error.ConnectionException, KafkaInstance.KafkaInstance | Scope.Scope> =>
  Effect.gen(function* () {
    const instance = yield* KafkaInstance.KafkaInstance;
    return yield* instance.consumer(options);
  });

/** @internal */
export const serve = dual<
  {
    (
      options: Consumer.Consumer.ConsumerOptions,
    ): <E, R>(
      app: MessageRouter.MessageRouter<E, R>,
    ) => Layer.Layer<
      never,
      Error.ConnectionException,
      KafkaInstance.KafkaInstance | Exclude<R, ConsumerRecord.ConsumerRecord | Scope.Scope>
    >;
  },
  {
    <E, R>(
      app: MessageRouter.MessageRouter<E, R>,
      options: Consumer.Consumer.ConsumerOptions,
    ): Layer.Layer<
      never,
      Error.ConnectionException,
      KafkaInstance.KafkaInstance | Exclude<R, ConsumerRecord.ConsumerRecord | Scope.Scope>
    >;
  }
>(
  (args) => Effect.isEffect(args[0]),
  <E, R>(
    app: MessageRouter.MessageRouter<E, R>,
    options: Consumer.Consumer.ConsumerOptions,
  ): Layer.Layer<
    never,
    Error.ConnectionException,
    KafkaInstance.KafkaInstance | Exclude<R, ConsumerRecord.ConsumerRecord | Scope.Scope>
  > =>
    Layer.scopedDiscard(
      Effect.gen(function* () {
        const instance = yield* KafkaInstance.KafkaInstance;
        const consumer = yield* instance.consumer(options);
        yield* consumer.run(app);
      }),
    ) as any,
);

/** @internal */
export const serveEffect = dual<
  {
    (
      options: Consumer.Consumer.ConsumerOptions,
    ): <E, R>(
      app: MessageRouter.MessageRouter<E, R>,
    ) => Effect.Effect<
      void,
      Error.ConnectionException,
      KafkaInstance.KafkaInstance | Scope.Scope | Exclude<R, ConsumerRecord.ConsumerRecord>
    >;
  },
  {
    <E, R>(
      app: MessageRouter.MessageRouter<E, R>,
      options: Consumer.Consumer.ConsumerOptions,
    ): Effect.Effect<
      void,
      Error.ConnectionException,
      KafkaInstance.KafkaInstance | Scope.Scope | Exclude<R, ConsumerRecord.ConsumerRecord>
    >;
  }
>(
  (args) => Effect.isEffect(args[0]),
  <E, R>(
    app: MessageRouter.MessageRouter<E, R>,
    options: Consumer.Consumer.ConsumerOptions,
  ): Effect.Effect<
    void,
    Error.ConnectionException,
    KafkaInstance.KafkaInstance | Scope.Scope | Exclude<R, ConsumerRecord.ConsumerRecord>
  > =>
    Effect.gen(function* () {
      const instance = yield* KafkaInstance.KafkaInstance;
      const consumer = yield* instance.consumer(options);
      yield* consumer.run(app);
    }),
);

/** @internal */
export const serveStream = (
  path: MessageRouter.Route.Path,
): Stream.Stream<ConsumerRecord.ConsumerRecord, never, Consumer.Consumer> =>
  consumerTag.pipe(
    Effect.map((consumer) => consumer.runStream(path)),
    Stream.flatten(),
  );
