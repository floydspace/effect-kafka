/**
 * @since 0.1.0
 */
import { Cause, Chunk, Context, Effect, Inspectable, Layer, Scope } from "effect";
import type * as App from "./ConsumerApp.js";
import type * as ConsumerRecord from "./ConsumerRecord.js";
import * as internal from "./internal/messageRouter.js";

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
export interface MessageRouter<E = never, R = never> extends App.Default<E, R>, Inspectable.Inspectable {
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
  export type Provided = ConsumerRecord.ConsumerRecord | Scope.Scope;

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
    readonly subscribe: (path: Route.Path, handler: Route.Handler<E, R | Provided>) => Effect.Effect<void>;
    readonly concat: (router: MessageRouter<E, R>) => Effect.Effect<void>;
  }

  /**
   * @since 0.1.0
   */
  export interface TagClass<Self, Name extends string, E, R> extends Context.Tag<Self, Service<E, R>> {
    readonly Live: Layer.Layer<Self>;
    readonly router: Effect.Effect<MessageRouter<E, R>, never, Self>;
    readonly use: <XA, XE, XR>(f: (router: Service<E, R>) => Effect.Effect<XA, XE, XR>) => Layer.Layer<never, XE, XR>;
    readonly useScoped: <XA, XE, XR>(
      f: (router: Service<E, R>) => Effect.Effect<XA, XE, XR>,
    ) => Layer.Layer<never, XE, Exclude<XR, Scope.Scope>>;
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
  export type Handler<E, R> = App.Default<E, R>;
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
) => Route<E, MessageRouter.ExcludeProvided<R>> = internal.makeRoute;

/**
 * @since 1.0.0
 * @category combinators
 */
export const append: {
  /**
   * @since 1.0.0
   * @category combinators
   */
  <R1, E1>(
    route: Route<E1, R1>,
  ): <E, R>(self: MessageRouter<E, R>) => MessageRouter<E1 | E, R | MessageRouter.ExcludeProvided<R1>>;
  /**
   * @since 1.0.0
   * @category combinators
   */
  <E, R, E1, R1>(
    self: MessageRouter<E, R>,
    route: Route<E1, R1>,
  ): MessageRouter<E | E1, R | MessageRouter.ExcludeProvided<R1>>;
} = internal.append;

/**
 * @since 1.0.0
 * @category combinators
 */
export const concat: {
  /**
   * @since 1.0.0
   * @category combinators
   */
  <R1, E1>(that: MessageRouter<E1, R1>): <E, R>(self: MessageRouter<E, R>) => MessageRouter<E1 | E, R1 | R>;
  /**
   * @since 1.0.0
   * @category combinators
   */
  <E, R, R1, E1>(self: MessageRouter<E, R>, that: MessageRouter<E1, R1>): MessageRouter<E | E1, R | R1>;
} = internal.concat;

/**
 * @since 1.0.0
 * @category combinators
 */
export const concatAll: <Routers extends ReadonlyArray<MessageRouter<unknown, unknown>>>(
  ...routers: Routers
) => [Routers[number]] extends [MessageRouter<infer E, infer R>] ? MessageRouter<E, R> : never =
  internal.concatAll as any;

/**
 * @since 0.1.0
 * @category routing
 */
export const subscribe: {
  /**
   * @since 0.1.0
   * @category routing
   */
  <E1, R1>(
    topic: Route.Path,
    handler: Route.Handler<E1, R1>,
  ): <E, R>(self: MessageRouter<E, R>) => MessageRouter<E1 | E, R | MessageRouter.ExcludeProvided<R1>>;
  /**
   * @since 0.1.0
   * @category routing
   */
  <E, R, E1, R1>(
    self: MessageRouter<E, R>,
    topic: Route.Path,
    handler: Route.Handler<E1, R1>,
  ): MessageRouter<E | E1, R | MessageRouter.ExcludeProvided<R1>>;
} = internal.subscribe;

/**
 * @since 0.5.0
 * @category combinators
 */
export const transform: {
  /**
   * @since 0.5.0
   * @category combinators
   */
  <E, R, R1, E1>(
    f: (self: Route.Handler<E, R>) => App.Default<E1, R1>,
  ): (self: MessageRouter<E, R>) => MessageRouter<E1, MessageRouter.ExcludeProvided<R1>>;
  /**
   * @since 0.5.0
   * @category combinators
   */
  <E, R, R1, E1>(
    self: MessageRouter<E, R>,
    f: (self: Route.Handler<E, R>) => App.Default<E1, R1>,
  ): MessageRouter<E1, MessageRouter.ExcludeProvided<R1>>;
} = internal.transform;

/**
 * @since 0.5.0
 * @category combinators
 */
export const catchAll: {
  /**
   * @since 0.5.0
   * @category combinators
   */
  <E, E2, R2>(
    f: (e: E) => Route.Handler<E2, R2>,
  ): <R>(self: MessageRouter<E, R>) => MessageRouter<E2, R | MessageRouter.ExcludeProvided<R2>>;
  /**
   * @since 0.5.0
   * @category combinators
   */
  <E, R, E2, R2>(
    self: MessageRouter<E, R>,
    f: (e: E) => Route.Handler<E2, R2>,
  ): MessageRouter<E2, R | MessageRouter.ExcludeProvided<R2>>;
} = internal.catchAll;

/**
 * @since 0.5.0
 * @category combinators
 */
export const catchAllCause: {
  /**
   * @since 0.5.0
   * @category combinators
   */
  <E, E2, R2>(
    f: (e: Cause.Cause<E>) => Route.Handler<E2, R2>,
  ): <R>(self: MessageRouter<E, R>) => MessageRouter<E2, R | MessageRouter.ExcludeProvided<R2>>;
  /**
   * @since 0.5.0
   * @category combinators
   */
  <E, R, E2, R2>(
    self: MessageRouter<E, R>,
    f: (e: Cause.Cause<E>) => Route.Handler<E2, R2>,
  ): MessageRouter<E2, R | MessageRouter.ExcludeProvided<R2>>;
} = internal.catchAllCause;

/**
 * @since 0.5.0
 * @category combinators
 */
export const catchTag: {
  /**
   * @since 0.5.0
   * @category combinators
   */
  <K extends E extends { _tag: string } ? E["_tag"] : never, E, E1, R1>(
    k: K,
    f: (e: Extract<E, { _tag: K }>) => Route.Handler<E1, R1>,
  ): <R>(
    self: MessageRouter<E, R>,
  ) => MessageRouter<E1 | Exclude<E, { _tag: K }>, R | MessageRouter.ExcludeProvided<R1>>;
  /**
   * @since 0.5.0
   * @category combinators
   */
  <E, R, K extends E extends { _tag: string } ? E["_tag"] : never, E1, R1>(
    self: MessageRouter<E, R>,
    k: K,
    f: (e: Extract<E, { _tag: K }>) => Route.Handler<E1, R1>,
  ): MessageRouter<E1 | Exclude<E, { _tag: K }>, R | MessageRouter.ExcludeProvided<R1>>;
} = internal.catchTag;

/**
 * @since 0.5.0
 * @category combinators
 */
export const catchTags: {
  /**
   * @since 0.5.0
   * @category combinators
   */
  <
    E,
    Cases extends E extends { _tag: string }
      ? { [K in E["_tag"]]+?: ((error: Extract<E, { _tag: K }>) => Route.Handler<any, any>) | undefined }
      : {},
  >(
    cases: Cases,
  ): <R>(self: MessageRouter<E, R>) => MessageRouter<
    | Exclude<E, { _tag: keyof Cases }>
    | {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        [K in keyof Cases]: Cases[K] extends (...args: Array<any>) => Effect.Effect<any, infer E, any> ? E : never;
      }[keyof Cases],
    | R
    | MessageRouter.ExcludeProvided<
        {
          // eslint-disable-next-line @typescript-eslint/no-shadow
          [K in keyof Cases]: Cases[K] extends (...args: Array<any>) => Effect.Effect<any, any, infer R> ? R : never;
        }[keyof Cases]
      >
  >;
  /**
   * @since 0.5.0
   * @category combinators
   */
  <
    R,
    E,
    Cases extends E extends { _tag: string }
      ? { [K in E["_tag"]]+?: ((error: Extract<E, { _tag: K }>) => Route.Handler<any, any>) | undefined }
      : {},
  >(
    self: MessageRouter<E, R>,
    cases: Cases,
  ): MessageRouter<
    | Exclude<E, { _tag: keyof Cases }>
    | {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        [K in keyof Cases]: Cases[K] extends (...args: Array<any>) => Effect.Effect<any, infer E, any> ? E : never;
      }[keyof Cases],
    | R
    | MessageRouter.ExcludeProvided<
        {
          // eslint-disable-next-line @typescript-eslint/no-shadow
          [K in keyof Cases]: Cases[K] extends (...args: Array<any>) => Effect.Effect<any, any, infer R> ? R : never;
        }[keyof Cases]
      >
  >;
} = internal.catchTags;

/**
 * @since 0.5.0
 * @category combinators
 */
export const provideService: {
  /**
   * @since 0.5.0
   * @category combinators
   */
  <T extends Context.Tag<any, any>>(
    tag: T,
    service: Context.Tag.Service<T>,
  ): <E, R>(self: MessageRouter<E, R>) => MessageRouter<E, Exclude<R, Context.Tag.Identifier<T>>>;
  /**
   * @since 0.5.0
   * @category combinators
   */
  <E, R, T extends Context.Tag<any, any>>(
    self: MessageRouter<E, R>,
    tag: T,
    service: Context.Tag.Service<T>,
  ): MessageRouter<E, Exclude<R, Context.Tag.Identifier<T>>>;
} = internal.provideService;

/**
 * @since 0.5.0
 * @category combinators
 */
export const provideServiceEffect: {
  /**
   * @since 0.5.0
   * @category combinators
   */
  <T extends Context.Tag<any, any>, R1, E1>(
    tag: T,
    effect: Effect.Effect<Context.Tag.Service<T>, E1, R1>,
  ): <E, R>(
    self: MessageRouter<E, R>,
  ) => MessageRouter<
    E1 | E,
    Exclude<R, Context.Tag.Identifier<T>> | Exclude<MessageRouter.ExcludeProvided<R1>, Context.Tag.Identifier<T>>
  >;
  /**
   * @since 0.5.0
   * @category combinators
   */
  <E, R, T extends Context.Tag<any, any>, R1, E1>(
    self: MessageRouter<E, R>,
    tag: T,
    effect: Effect.Effect<Context.Tag.Service<T>, E1, R1>,
  ): MessageRouter<
    E | E1,
    Exclude<R, Context.Tag.Identifier<T>> | Exclude<MessageRouter.ExcludeProvided<R1>, Context.Tag.Identifier<T>>
  >;
} = internal.provideServiceEffect;

/**
 * @since 0.5.0
 * @category tags
 */
export const Tag: <const Name extends string>(
  id: Name,
) => <Self, R = never, E = unknown>() => MessageRouter.TagClass<Self, Name, E, R> = internal.Tag;

/**
 * @since 0.5.0
 * @category tags
 */
export class Default extends Tag("effect-kafka/MessageRouter/Default")<Default>() {}
