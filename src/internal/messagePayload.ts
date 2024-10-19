import { Context } from "effect";
import type * as MessagePayload from "../MessagePayload";

/** @internal */
export const TypeId: MessagePayload.TypeId = Symbol.for("effect-kafka/MessagePayload") as MessagePayload.TypeId;

/** @internal */
export const messagePayloadTag = Context.GenericTag<MessagePayload.MessagePayload>("effect-kafka/MessagePayload");

const messagePayloadProto = {
  [TypeId]: TypeId,
};

/** @internal */
export const make = (payload: {
  readonly topic: string;
  readonly partition: number;
  readonly message: MessagePayload.MessagePayload.Message;
}): MessagePayload.MessagePayload => Object.assign(Object.create(messagePayloadProto), payload);
