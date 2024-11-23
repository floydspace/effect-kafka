import { Chunk, Context, Effect, Fiber, Layer, Queue, Scope, Stream } from "effect";
import { dual } from "effect/Function";
import type * as Consumer from "../Consumer.js";
import type * as ConsumerRecord from "../ConsumerRecord.js";
import type * as Error from "../KafkaError.js";
import type * as KafkaInstance from "../KafkaInstance.js";
import type * as MessageRouter from "../MessageRouter.js";
import { consumerRecordTag } from "./consumerRecord.js";
import { instanceTag } from "./kafkaInstance.js";

/** @internal */
export const TypeId: Consumer.TypeId = Symbol.for("effect-kafka/Consumer") as Consumer.TypeId;

/** @internal */
export const consumerTag = Context.GenericTag<Consumer.Consumer>("effect-kafka/Consumer");

const consumerProto = {
  [TypeId]: TypeId,
};

/** @internal */
export type ConsumerConstructorProps = {
  readonly subscribe: (paths: MessageRouter.Route.Path[]) => Effect.Effect<void, never, Scope.Scope>;
  readonly consume: () => Effect.Effect<Queue.Dequeue<ConsumerRecord.ConsumerRecord>, never, Scope.Scope>;
};

/** @internal */
export const make = (options: ConsumerConstructorProps): Consumer.Consumer =>
  Object.assign(Object.create(consumerProto), options);

/** @internal */
export const makeConsumer = (
  options: Consumer.Consumer.ConsumerOptions,
): Effect.Effect<Consumer.Consumer, Error.ConnectionException, KafkaInstance.KafkaInstance | Scope.Scope> =>
  Effect.gen(function* () {
    const instance = yield* instanceTag;
    return yield* instance.consumer(options);
  });

/** @internal */
export const serveOnceEffect = dual<
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
      const instance = yield* instanceTag;
      const consumer = yield* instance.consumer(options);

      const topics = Chunk.toArray(app.routes).map((route) => route.topic);

      yield* consumer.subscribe(topics);

      const queue = yield* consumer.consume();

      yield* app.pipe(Effect.provideServiceEffect(consumerRecordTag, queue)).pipe(Effect.orDie);
    }),
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
      const instance = yield* instanceTag;
      const consumer = yield* instance.consumer(options);

      const topics = Chunk.toArray(app.routes).map((route) => route.topic);

      yield* consumer.subscribe(topics);

      const queue = yield* consumer.consume();

      const fork = yield* app.pipe(Effect.provideServiceEffect(consumerRecordTag, queue), Effect.forever, Effect.fork);

      yield* Fiber.join(fork).pipe(Effect.orDie);
    }),
);

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
  > => Layer.scopedDiscard(serveEffect(app, options)) as any,
);

/** @internal */
export const serveStream = (
  path: MessageRouter.Route.Path,
): Stream.Stream<ConsumerRecord.ConsumerRecord, never, Consumer.Consumer> =>
  consumerTag.pipe(
    Effect.tap((consumer) => consumer.subscribe([path])),
    Effect.flatMap((consumer) => consumer.consume()),
    Effect.map(Stream.fromQueue),
    Stream.scoped,
    Stream.flatten(),
  );
