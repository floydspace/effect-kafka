import { Context, Effect, Layer, Scope } from "effect";
import { dual } from "effect/Function";
import type * as Consumer from "../Consumer";
import * as KafkaInstance from "../KafkaInstance";
import type * as MessagePayload from "../MessagePayload";
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
  readonly run: (app: MessageRouter.MessageRouter<void>) => Effect.Effect<void, never, Scope.Scope>;
}): Consumer.Consumer => Object.assign(Object.create(consumerProto), options);

/** @internal */
export const serve = dual<
  {
    (
      options: Consumer.Consumer.ConsumerOptions,
    ): <E, R>(
      app: MessageRouter.MessageRouter<E, R>,
    ) => Layer.Layer<
      never,
      never,
      KafkaInstance.KafkaInstance | Exclude<R, MessagePayload.MessagePayload | Scope.Scope>
    >;
  },
  {
    <E, R>(
      app: MessageRouter.MessageRouter<E, R>,
      options: Consumer.Consumer.ConsumerOptions,
    ): Layer.Layer<never, never, KafkaInstance.KafkaInstance | Exclude<R, MessagePayload.MessagePayload | Scope.Scope>>;
  }
>(
  (args) => Effect.isEffect(args[0]),
  <E, R>(
    app: MessageRouter.MessageRouter<E, R>,
    options: Consumer.Consumer.ConsumerOptions,
  ): Layer.Layer<never, never, KafkaInstance.KafkaInstance | Exclude<R, MessagePayload.MessagePayload | Scope.Scope>> =>
    Layer.scopedDiscard(
      Effect.gen(function* () {
        const kafka = yield* KafkaInstance.KafkaInstance;
        const consumer = yield* kafka.consumer(options);
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
      never,
      KafkaInstance.KafkaInstance | Scope.Scope | Exclude<R, MessagePayload.MessagePayload>
    >;
  },
  {
    <E, R>(
      app: MessageRouter.MessageRouter<E, R>,
      options: Consumer.Consumer.ConsumerOptions,
    ): Effect.Effect<
      void,
      never,
      KafkaInstance.KafkaInstance | Scope.Scope | Exclude<R, MessagePayload.MessagePayload>
    >;
  }
>(
  (args) => Effect.isEffect(args[0]),
  <E, R>(
    app: MessageRouter.MessageRouter<E, R>,
    options: Consumer.Consumer.ConsumerOptions,
  ): Effect.Effect<
    void,
    never,
    KafkaInstance.KafkaInstance | Scope.Scope | Exclude<R, MessagePayload.MessagePayload>
  > =>
    Effect.gen(function* () {
      const kafka = yield* KafkaInstance.KafkaInstance;
      const consumer = yield* kafka.consumer(options);
      yield* consumer.run(app);
    }),
);
