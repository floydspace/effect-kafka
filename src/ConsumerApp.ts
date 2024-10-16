import { Effect } from "effect";
import type * as MessagePayload from "./MessagePayload";

/**
 * @since 1.0.0
 * @category models
 */
export type ConsumerApp<A = void, E = never, R = never> = Effect.Effect<A, E, R | MessagePayload.MessagePayload>;

/**
 * @since 1.0.0
 * @category models
 */
export type Default<E = never, R = never> = ConsumerApp<void, E, R>;
