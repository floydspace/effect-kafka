import { Context, Effect, Scope } from "effect";
import type { Consumer } from "../Consumer.js";
import type * as Error from "../ConsumerError.js";
import type * as KafkaInstance from "../KafkaInstance.js";
import type { Producer } from "../Producer.js";

/** @internal */
export const TypeId: KafkaInstance.TypeId = Symbol.for("effect-kafka/KafkaInstance") as KafkaInstance.TypeId;

/** @internal */
export const instanceTag = Context.GenericTag<KafkaInstance.KafkaInstance>("effect-kafka/KafkaInstance");

const instanceProto = {
  [TypeId]: TypeId,
};

export type InstanceConstructorProps = {
  readonly producer: {
    (options?: Producer.ProducerOptions): Effect.Effect<Producer, Error.ConnectionException, Scope.Scope>;
  };
  readonly consumer: {
    (options: Consumer.ConsumerOptions): Effect.Effect<Consumer, Error.ConnectionException, Scope.Scope>;
  };
};

/** @internal */
export const make = (options: InstanceConstructorProps): KafkaInstance.KafkaInstance =>
  Object.assign(Object.create(instanceProto), options);
