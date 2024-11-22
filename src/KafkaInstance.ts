/**
 * @since 0.2.0
 */
import { Context } from "effect";
import * as internal from "./internal/kafkaInstance.js";

/**
 * @since 0.2.0
 * @category type ids
 */
export const TypeId: unique symbol = internal.TypeId;

/**
 * @since 0.2.0
 * @category type ids
 */
export type TypeId = typeof TypeId;

/**
 * @since 0.2.0
 * @category models
 */
export interface KafkaInstance extends internal.InstanceConstructorProps {
  readonly [TypeId]: TypeId;
}

/**
 * @since 0.2.0
 * @category constructors
 */
export const KafkaInstance: Context.Tag<KafkaInstance, KafkaInstance> = internal.instanceTag;

/**
 * @since 0.2.0
 * @category constructors
 */
export const make: (options: internal.InstanceConstructorProps) => KafkaInstance = internal.make;
