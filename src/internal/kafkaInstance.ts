import { Context, Effect, Scope } from "effect";
import type * as Consumer from "../Consumer";
import type * as KafkaInstance from "../KafkaInstance";
import type * as Producer from "../Producer";

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
    (options: Producer.Producer.ProducerOptions): Effect.Effect<never, never, Scope.Scope>;
  };
  readonly consumer: {
    (options: Consumer.Consumer.ConsumerOptions): Effect.Effect<Consumer.Consumer, never, Scope.Scope>;
  };
}): KafkaInstance.KafkaInstance => Object.assign(Object.create(instanceProto), options);
