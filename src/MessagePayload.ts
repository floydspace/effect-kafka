/**
 * @since 0.1.0
 */
import type * as Context from "effect/Context";
import type { KafkaMessage } from "kafkajs"; // TODO: use generic type
import * as internal from "./internal/messagePayload";

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
export interface MessagePayload {
  readonly [TypeId]: TypeId;
  readonly topic: string;
  readonly partition: number;
  readonly message: MessagePayload.Message;
  // readonly heartbeat: () => Promise<void>; // TODO: use Effect
  // readonly pause: () => () => void;
}

/**
 * @since 0.1.0
 * @category context
 */
export const MessagePayload: Context.Tag<MessagePayload, MessagePayload> = internal.messagePayloadTag;

export declare namespace MessagePayload {
  /**
   * @since 0.2.0
   */
  export type Message = KafkaMessage;
}

/**
 * @since 0.1.0
 * @category constructors
 */
export const make: (payload: {
  readonly topic: string;
  readonly partition: number;
  readonly message: MessagePayload.Message;
}) => MessagePayload = internal.make;
