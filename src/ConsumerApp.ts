/**
 * @since 0.6.0
 */
import { Effect } from "effect";
import type * as ConsumerRecord from "./ConsumerRecord.js";

/**
 * @since 0.1.0
 * @category models
 */
export type Default<E = never, R = never> = Effect.Effect<void, E, R | ConsumerRecord.ConsumerRecord>;
