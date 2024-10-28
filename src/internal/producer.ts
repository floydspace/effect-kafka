import { Context, Effect, FiberRef, Layer, Scope } from "effect";
import { dual } from "effect/Function";
import { globalValue } from "effect/GlobalValue";
import type * as Error from "../ConsumerError";
import * as KafkaInstance from "../KafkaInstance";
import type * as Producer from "../Producer";

/** @internal */
export const TypeId: Producer.TypeId = Symbol.for("effect-kafka/Producer") as Producer.TypeId;

/** @internal */
export const producerTag = Context.GenericTag<Producer.Producer>("effect-kafka/Producer");

const producerProto = {
  [TypeId]: TypeId,
};

/** @internal */
export type ProducerConstructorProps = {
  readonly send: (record: Producer.Producer.ProducerRecord) => Effect.Effect<Producer.Producer.RecordMetadata[]>;
  readonly sendBatch: (batch: Producer.Producer.ProducerBatch) => Effect.Effect<Producer.Producer.RecordMetadata[]>;
};

/** @internal */
export const currentProducerOptions = globalValue("effect-kafka/Producer/currentProducerOptions", () =>
  FiberRef.unsafeMake<Producer.Producer.ProducerOptions>({}),
);

/** @internal */
export const withProducerOptions: {
  (config: Producer.Producer.ProducerOptions): <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>;
  <A, E, R>(effect: Effect.Effect<A, E, R>, config: Producer.Producer.ProducerOptions): Effect.Effect<A, E, R>;
} = dual(
  2,
  <A, E, R>(effect: Effect.Effect<A, E, R>, config: Producer.Producer.ProducerOptions): Effect.Effect<A, E, R> =>
    Effect.locally(effect, currentProducerOptions, config),
);

/** @internal */
export const setProducerOptions = (config: Producer.Producer.ProducerOptions) =>
  Layer.locallyScoped(currentProducerOptions, config);

/** @internal */
export const make = (options: ProducerConstructorProps): Producer.Producer =>
  Object.assign(Object.create(producerProto), options);

/** @internal */
export const makeProducer = (
  options?: Producer.Producer.ProducerOptions,
): Effect.Effect<Producer.Producer, Error.ConnectionException, KafkaInstance.KafkaInstance | Scope.Scope> =>
  Effect.gen(function* () {
    const instance = yield* KafkaInstance.KafkaInstance;
    return yield* instance.producer(options);
  });

/** @internal */
export const send = (
  record: Producer.Producer.ProducerRecord,
): Effect.Effect<
  Producer.Producer.RecordMetadata[],
  Error.ConnectionException,
  KafkaInstance.KafkaInstance | Scope.Scope
> =>
  Effect.gen(function* () {
    const options = yield* FiberRef.get(currentProducerOptions);
    const producer = yield* makeProducer(options);
    return yield* producer.send(record);
  });
