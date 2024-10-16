import { Chunk, Context, Effect, Inspectable, Layer, Scope } from "effect";
import type * as App from "./ConsumerApp";
import type * as Error from "./ConsumerError";
import * as internal from "./internal/messageRouter";
import type * as MessagePayload from "./MessagePayload";

/**
 * @since 1.0.0
 * @category type ids
 */
export const TypeId: unique symbol = internal.TypeId;

/**
 * @since 1.0.0
 * @category type ids
 */
export type TypeId = typeof TypeId;

/**
 * @since 1.0.0
 * @category models
 */
export interface MessageRouter<E = never, R = never>
  extends App.Default<E | Error.RouteNotFound, R>,
    Inspectable.Inspectable {
  readonly [TypeId]: TypeId;
  readonly routes: Chunk.Chunk<Route<E, R>>;
}

/**
 * @since 1.0.0
 */
export declare namespace MessageRouter {
  /**
   * @since 1.0.0
   */
  export type Provided = MessagePayload.MessagePayload | Scope.Scope;

  /**
   * @since 1.0.0
   */
  export type ExcludeProvided<A> = Exclude<A, Provided>;

  /**
   * @since 1.0.0
   */
  export interface Service<E, R> {
    readonly router: Effect.Effect<MessageRouter<E, R>>;
    readonly addRoute: (route: Route<E, R>) => Effect.Effect<void>;
    readonly subscribe: (
      path: string | RegExp,
      handler: Route.Handler<E, R | Provided>,
      options?: { readonly fromBeginning?: boolean | undefined } | undefined,
    ) => Effect.Effect<void>;
    readonly concat: (router: MessageRouter<E, R>) => Effect.Effect<void>;
  }

  /**
   * @since 1.0.0
   */
  export interface TagClass<Self, Name extends string, E, R> extends Context.Tag<Self, Service<E, R>> {
    readonly Live: Layer.Layer<Self>;
    readonly router: Effect.Effect<MessageRouter<E, R>, never, Self>;
    // readonly use: <XA, XE, XR>(
    //   f: (router: Service<E, R>) => Effect.Effect<XA, XE, XR>,
    // ) => Layer.Layer<never, XE, XR>;
    // readonly useScoped: <XA, XE, XR>(
    //   f: (router: Service<E, R>) => Effect.Effect<XA, XE, XR>,
    // ) => Layer.Layer<never, XE, Exclude<XR, Scope.Scope>>;
    readonly unwrap: <XA, XE, XR>(
      f: (router: MessageRouter<E, R>) => Layer.Layer<XA, XE, XR>,
    ) => Layer.Layer<XA, XE, XR>;
    new (_: never): Context.TagClassShape<Name, Service<E, R>>;
  }
}

/**
 * @since 1.0.0
 * @category type ids
 */
export const RouteTypeId: unique symbol = internal.RouteTypeId;

/**
 * @since 1.0.0
 * @category type ids
 */
export type RouteTypeId = typeof RouteTypeId;

/**
 * @since 1.0.0
 * @category models
 */
export interface Route<E = never, R = never> {
  readonly [RouteTypeId]: RouteTypeId;
  readonly topic: string | RegExp;
  readonly handler: Route.Handler<E, R>;
  readonly fromBeginning: boolean;
}

/**
 * @since 1.0.0
 */
export declare namespace Route {
  /**
   * @since 1.0.0
   */
  export type Handler<E, R> = App.Default<E, R>;
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const empty: MessageRouter = internal.empty;

/**
 * @since 1.0.0
 * @category constructors
 */
export const fromIterable: <R extends Route<any, any>>(
  routes: Iterable<R>,
) => MessageRouter<R extends Route<infer E, infer _> ? E : never, R extends Route<infer _, infer Env> ? Env : never> =
  internal.fromIterable;

/**
 * @since 1.0.0
 * @category constructors
 */
export const makeRoute: <E, R>(
  topic: string | RegExp,
  handler: Route.Handler<E, R>,
  options?: { readonly fromBeginning?: boolean | undefined } | undefined,
) => Route<E, MessageRouter.ExcludeProvided<R>> = internal.makeRoute;

/**
 * @since 1.0.0
 * @category routing
 */
export const subscribe: {
  /**
   * @since 1.0.0
   * @category routing
   */
  <R1, E1>(
    topic: string | RegExp,
    handler: Route.Handler<E1, R1>,
    options?: { readonly fromBeginning?: boolean | undefined } | undefined,
  ): <E, R>(self: MessageRouter<E, R>) => MessageRouter<E1 | E, R | MessageRouter.ExcludeProvided<R1>>;
  /**
   * @since 1.0.0
   * @category routing
   */
  <E, R, E1, R1>(
    self: MessageRouter<E, R>,
    topic: string | RegExp,
    handler: Route.Handler<E1, R1>,
    options?: { readonly fromBeginning?: boolean | undefined } | undefined,
  ): MessageRouter<E | E1, R | MessageRouter.ExcludeProvided<R1>>;
} = internal.subscribe;
