/**
 * @since 0.1.0
 */
import { Chunk, Context, Effect, Inspectable, Layer, Scope } from "effect";
import type * as Error from "./ConsumerError";
import * as internal from "./internal/messageRouter";
import type * as MessagePayload from "./MessagePayload";

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
export type Default<E = never, R = never> = Effect.Effect<void, E, R | MessagePayload.MessagePayload>;

/**
 * @since 0.1.0
 * @category models
 */
export interface MessageRouter<E = never, R = never>
  extends Default<E | Error.RouteNotFound, R>,
    Inspectable.Inspectable {
  readonly [TypeId]: TypeId;
  readonly routes: Chunk.Chunk<Route<E, R>>;
}

/**
 * @since 0.1.0
 */
export declare namespace MessageRouter {
  /**
   * @since 0.1.0
   */
  export type Provided = MessagePayload.MessagePayload | Scope.Scope;

  /**
   * @since 0.1.0
   */
  export type ExcludeProvided<A> = Exclude<A, Provided>;

  /**
   * @since 0.1.0
   */
  export interface Service<E, R> {
    readonly router: Effect.Effect<MessageRouter<E, R>>;
    readonly addRoute: (route: Route<E, R>) => Effect.Effect<void>;
    readonly subscribe: (
      path: Route.Path,
      handler: Route.Handler<E, R | Provided>,
      options?: { readonly fromBeginning?: boolean | undefined } | undefined,
    ) => Effect.Effect<void>;
    readonly concat: (router: MessageRouter<E, R>) => Effect.Effect<void>;
  }

  /**
   * @since 0.1.0
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
 * @since 0.1.0
 * @category type ids
 */
export const RouteTypeId: unique symbol = internal.RouteTypeId;

/**
 * @since 0.1.0
 * @category type ids
 */
export type RouteTypeId = typeof RouteTypeId;

/**
 * @since 0.1.0
 * @category models
 */
export interface Route<E = never, R = never> {
  readonly [RouteTypeId]: RouteTypeId;
  readonly topic: Route.Path;
  readonly handler: Route.Handler<E, R>;
  readonly fromBeginning: boolean;
}

/**
 * @since 0.1.0
 */
export declare namespace Route {
  /**
   * @since 0.2.0
   */
  export type Path = string | RegExp;

  /**
   * @since 0.1.0
   */
  export type Handler<E, R> = Default<E, R>;
}

/**
 * @since 0.1.0
 * @category constructors
 */
export const empty: MessageRouter = internal.empty;

/**
 * @since 0.1.0
 * @category constructors
 */
export const fromIterable: <R extends Route<any, any>>(
  routes: Iterable<R>,
) => MessageRouter<R extends Route<infer E, infer _> ? E : never, R extends Route<infer _, infer Env> ? Env : never> =
  internal.fromIterable;

/**
 * @since 0.1.0
 * @category constructors
 */
export const makeRoute: <E, R>(
  topic: Route.Path,
  handler: Route.Handler<E, R>,
  options?: { readonly fromBeginning?: boolean | undefined } | undefined,
) => Route<E, MessageRouter.ExcludeProvided<R>> = internal.makeRoute;

/**
 * @since 0.1.0
 * @category routing
 */
export const subscribe: {
  /**
   * @since 0.1.0
   * @category routing
   */
  <R1, E1>(
    topic: Route.Path,
    handler: Route.Handler<E1, R1>,
    options?: { readonly fromBeginning?: boolean | undefined } | undefined,
  ): <E, R>(self: MessageRouter<E, R>) => MessageRouter<E1 | E, R | MessageRouter.ExcludeProvided<R1>>;
  /**
   * @since 0.1.0
   * @category routing
   */
  <E, R, E1, R1>(
    self: MessageRouter<E, R>,
    topic: Route.Path,
    handler: Route.Handler<E1, R1>,
    options?: { readonly fromBeginning?: boolean | undefined } | undefined,
  ): MessageRouter<E | E1, R | MessageRouter.ExcludeProvided<R1>>;
} = internal.subscribe;
