/**
 * @since 0.1.0
 */
import { Error } from "@effect/platform";
import * as internal from "./internal/consumerError";
import type * as MessagePayload from "./MessagePayload";

/**
 * @since 0.1.0
 * @category type id
 */
export const TypeId: unique symbol = internal.TypeId;

/**
 * @since 0.1.0
 * @category type id
 */
export type TypeId = typeof TypeId;

/**
 * @since 0.1.0
 * @category error
 */
export type ConsumerError = RouteNotFound;

/**
 * @since 0.1.0
 * @category error
 */
export class RouteNotFound extends Error.TypeIdError(TypeId, "RouteNotFound")<{
  readonly payload: MessagePayload.MessagePayload;
}> {
  constructor(options: { payload: MessagePayload.MessagePayload }) {
    super(options);
    (this as any).stack = `${this.name}: ${this.message}`;
  }
  get message() {
    return `${this.payload.topic} handler not found`;
  }
}
