/**
 * @since 0.1.0
 */
import type * as Context from "effect/Context";
import * as internal from "./internal/consumerRecord.js";

/**
 * @since 0.1.0
 * @category type ids
 */
export const TypeId: unique symbol = internal.TypeId;

/**
 * @since 0.1.0
 * @category type ids
 */
export type TypeId = typeof TypeId;

/**
 * @since 0.1.0
 * @category models
 */
export interface ConsumerRecord extends internal.ConsumerRecordConstructorProps {
  readonly [TypeId]: TypeId;
}

/**
 * @since 0.1.0
 * @category context
 */
export const ConsumerRecord: Context.Tag<ConsumerRecord, ConsumerRecord> = internal.consumerRecordTag;

/**
 * @since 0.2.0
 */
export declare namespace ConsumerRecord {
  /**
   * @since 0.2.0
   */
  export interface Headers {
    [key: string]: Buffer | string | (Buffer | string)[] | undefined;
  }
}

/**
 * @since 0.1.0
 * @category constructors
 */
export const make: (payload: internal.ConsumerRecordConstructorProps) => ConsumerRecord = internal.make;
