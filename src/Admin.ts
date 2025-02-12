/**
 * @since 0.7.0
 */
import { Context, Effect, Layer, Scope } from "effect";
import type * as AdminError from "./AdminError.js";
import * as internal from "./internal/admin.js";
import type * as Error from "./KafkaError.js";
import type * as KafkaInstance from "./KafkaInstance.js";

/**
 * @since 0.7.0
 * @category type ids
 */
export const TypeId: unique symbol = internal.TypeId;

/**
 * @since 0.7.0
 * @category type ids
 */
export type TypeId = typeof TypeId;

/**
 * @since 0.7.0
 * @category models
 */
export interface Admin extends internal.AdminConstructorProps {
  readonly [TypeId]: TypeId;
}

/**
 * @since 0.7.0
 * @category constructors
 */
export const Admin: Context.Tag<Admin, Admin> = internal.adminTag;

/**
 * @since 0.7.0
 */
export declare namespace Admin {
  /**
   * @since 0.7.0
   */
  export interface AdminOptions {}
}

/**
 * @since 0.7.0
 * @category constructors
 */
export const make: (options: internal.AdminConstructorProps) => Admin = internal.make;

/**
 * @since 0.7.0
 * @category constructors
 */
export const makeAdmin: (
  options?: Admin.AdminOptions,
) => Effect.Effect<Admin, Error.ConnectionException, KafkaInstance.KafkaInstance | Scope.Scope> = internal.makeAdmin;

/**
 * @since 0.7.0
 * @category layers
 */
export const layer = (options?: Admin.AdminOptions) => Layer.scoped(Admin, makeAdmin(options));

/**
 * List all topics in the Kafka cluster.
 *
 * @since 0.7.0
 * @category accessors
 */
export const listTopics: () => Effect.Effect<ReadonlyArray<string>, AdminError.AdminError, Admin> = internal.listTopics;
