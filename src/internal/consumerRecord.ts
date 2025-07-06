import { Context, Effect, Schema, SchemaAST, String } from "effect";
import type * as ConsumerRecord from "../ConsumerRecord.js";
import * as ConsumerSchema from "../ConsumerSchema.js";

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
export const schemaValueRaw = <A, R>(
  schema: Schema.Schema<A, Uint8Array, R>,
  options?: SchemaAST.ParseOptions | undefined,
) => {
  const parse = Schema.decodeUnknown(schema, options);
  return Effect.flatMap(consumerRecordTag, (self) => parse(self.value));
};

/** @internal */
export const schemaValueJson = <A, I, R>(
  schema: Schema.Schema<A, I, R>,
  options?: SchemaAST.ParseOptions | undefined,
) => {
  return schemaValueRaw(
    ConsumerSchema.String.pipe(Schema.compose(Schema.parseJson()), Schema.compose(schema)),
    options,
  );
};

/** @internal */
export const schemaHeaders = <A, I extends Readonly<Record<string, string | undefined>>, R>(
  schema: Schema.Schema<A, I, R>,
  options?: SchemaAST.ParseOptions | undefined,
) => {
  const parse = Schema.decodeUnknown(schema, options);
  return Effect.flatMap(consumerRecordTag, (self) => parse(self.headers));
};

/** @internal */
export const make = (payload: ConsumerRecordConstructorProps): ConsumerRecord.ConsumerRecord =>
  Object.assign(Object.create(consumerRecordProto), payload);

const noop = () => Effect.void;

/** @internal */
export const empty: ConsumerRecord.ConsumerRecord = make({
  topic: String.empty,
  partition: 0,
  highWatermark: "0",
  key: null,
  value: null,
  timestamp: "0",
  attributes: 0,
  offset: "0",
  heartbeat: noop,
  commit: noop,
});
