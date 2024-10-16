import type * as Error from "../ConsumerError";

/** @internal */
export const TypeId: Error.TypeId = Symbol.for("effect-kafka/ConsumerError") as Error.TypeId;
