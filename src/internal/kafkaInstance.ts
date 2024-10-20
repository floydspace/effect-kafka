import { Context, Effect, Scope } from "effect";
import type { Consumer } from "../Consumer";
import type * as Error from "../ConsumerError";
import type * as KafkaInstance from "../KafkaInstance";
import type { Producer } from "../Producer";

/** @internal */
export const TypeId: KafkaInstance.TypeId = Symbol.for("effect-kafka/KafkaInstance") as KafkaInstance.TypeId;

/** @internal */
export const instanceTag = Context.GenericTag<KafkaInstance.KafkaInstance>("effect-kafka/KafkaInstance");

const instanceProto = {
  [TypeId]: TypeId,
};

/** @internal */
export const make = (options: {
  readonly producer: {
    (options?: Producer.ProducerOptions): Effect.Effect<Producer, Error.ConnectionException, Scope.Scope>;
  };
  readonly consumer: {
    (options: Consumer.ConsumerOptions): Effect.Effect<Consumer, Error.ConnectionException, Scope.Scope>;
  };
}): KafkaInstance.KafkaInstance => Object.assign(Object.create(instanceProto), options);
