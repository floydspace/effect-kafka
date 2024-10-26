/**
 * @since 0.1.0
 */
import type { KafkaJS } from "@confluentinc/kafka-javascript"; // TODO: use generic type
import { Effect } from "effect";
import type * as Context from "effect/Context";
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
  readonly highWatermark: string;
  readonly key: Buffer | null;
  readonly value: Buffer | null;
  readonly timestamp: string;
  readonly attributes: number;
  readonly offset: string;
  readonly headers?: ConsumerRecord.Headers;
  readonly size?: number;
  // readonly resolveOffset: (offset: string) => void;
  readonly heartbeat: () => Effect.Effect<void>;
  // readonly pause: () => () => void;
  readonly commit: () => Effect.Effect<void>;
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
  export interface Headers extends KafkaJS.IHeaders {}
}

/**
 * @since 0.1.0
 * @category constructors
 */
export const make: (payload: {
  readonly topic: string;
  readonly partition: number;
  readonly highWatermark: string;
  readonly key: Buffer | null;
  readonly value: Buffer | null;
  readonly timestamp: string;
  readonly attributes: number;
  readonly offset: string;
  readonly headers?: ConsumerRecord.Headers;
  readonly size?: number;
  readonly heartbeat: () => Effect.Effect<void>;
  readonly commit: () => Effect.Effect<void>;
}) => ConsumerRecord = internal.make;
