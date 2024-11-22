import { Context, Effect } from "effect";
import type * as ConsumerRecord from "../ConsumerRecord.js";

/** @internal */
export const TypeId: ConsumerRecord.TypeId = Symbol.for("effect-kafka/ConsumerRecord") as ConsumerRecord.TypeId;

/** @internal */
export const consumerRecordTag = Context.GenericTag<ConsumerRecord.ConsumerRecord>("effect-kafka/ConsumerRecord");

const consumerRecordProto = {
  [TypeId]: TypeId,
};

export type ConsumerRecordConstructorProps = {
  readonly topic: string;
  readonly partition: number;
  readonly highWatermark: string;
  readonly key: Buffer | null;
  readonly value: Buffer | null;
  readonly timestamp: string;
  readonly attributes: number;
  readonly offset: string;
  readonly headers?: ConsumerRecord.ConsumerRecord.Headers;
  readonly size?: number;
  readonly heartbeat: () => Effect.Effect<void>;
  readonly commit: () => Effect.Effect<void>;
};

/** @internal */
export const make = (payload: ConsumerRecordConstructorProps): ConsumerRecord.ConsumerRecord =>
  Object.assign(Object.create(consumerRecordProto), payload);
