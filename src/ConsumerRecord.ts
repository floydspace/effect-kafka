/**
 * @since 0.1.0
 */
import type * as Context from "effect/Context";
import type { IHeaders } from "kafkajs"; // TODO: use generic type
import * as internal from "./internal/consumerRecord";

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
export interface ConsumerRecord {
  readonly [TypeId]: TypeId;
  readonly topic: string;
  readonly partition: number;
  readonly key: Buffer | null;
  readonly value: Buffer | null;
  readonly timestamp: string;
  readonly attributes: number;
  readonly offset: string;
  readonly headers?: ConsumerRecord.Headers;
  readonly size?: number;
  // readonly heartbeat: () => Promise<void>; // TODO: use Effect
  // readonly pause: () => () => void;
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
  export interface Headers extends IHeaders {}
}

/**
 * @since 0.1.0
 * @category constructors
 */
export const make: (payload: {
  readonly topic: string;
  readonly partition: number;
  readonly key: Buffer | null;
  readonly value: Buffer | null;
  readonly timestamp: string;
  readonly attributes: number;
  readonly offset: string;
  readonly headers?: ConsumerRecord.Headers;
  readonly size?: number;
}) => ConsumerRecord = internal.make;
