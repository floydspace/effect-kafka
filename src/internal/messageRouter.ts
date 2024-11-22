import {
  Cause,
  Chunk,
  Context,
  Effect,
  Effectable,
  FiberRef,
  Inspectable,
  Layer,
  Option,
  Predicate,
  Tracer,
} from "effect";
import { dual } from "effect/Function";
import type { Mutable } from "effect/Types";
import type * as App from "../ConsumerApp.js";
import * as Error from "../ConsumerError.js";
import type * as ConsumerRecord from "../ConsumerRecord.js";
import type * as Router from "../MessageRouter.js";
import { consumerRecordTag } from "./consumerRecord.js";

/** @internal */
export const TypeId: Router.TypeId = Symbol.for("effect-kafka/MessageRouter") as Router.TypeId;

/** @internal */
export const RouteTypeId: Router.RouteTypeId = Symbol.for("effect-kafka/MessageRouter/Route") as Router.RouteTypeId;

const isRouter = (u: unknown): u is Router.MessageRouter<unknown, unknown> => Predicate.hasProperty(u, TypeId);

class RouterImpl<E = never, R = never>
  extends Effectable.StructuralClass<void, E, R>
  implements Router.MessageRouter<E, R>
{
  readonly [TypeId]: Router.TypeId;
  private consumerApp: Effect.Effect<void, E, R>;
  constructor(readonly routes: Chunk.Chunk<Router.Route<E, R>>) {
    super();
    this[TypeId] = TypeId;
    this.consumerApp = toConsumerApp(this) as any;
  }
  commit() {
    return this.consumerApp;
  }
  toJSON() {
    return {
      _id: "effect-kafka/MessageRouter",
      routes: this.routes.toJSON(),
    };
  }
  toString() {
    return Inspectable.format(this);
  }
  [Inspectable.NodeInspectSymbol]() {
    return this.toJSON();
  }
}

const matchTopic =
  (topic: string) =>
  <E, R>(route: Router.Route<E, R>) => {
    if (typeof route.topic === "string") {
      return route.topic === topic;
    }
    return route.topic.test(topic);
  };

const toConsumerApp = <E, R>(self: Router.MessageRouter<E, R>): App.Default<E, R> => {
  return Effect.withFiberRuntime<void, E, R | ConsumerRecord.ConsumerRecord>((fiber) => {
    const context = fiber.getFiberRef(FiberRef.currentContext);
    const payload = Context.unsafeGet(context, consumerRecordTag);

    const result = Chunk.findFirst(self.routes, matchTopic(payload.topic));
    if (Option.isNone(result)) {
      return Effect.die(new Error.RouteNotFound({ payload }));
    }
    const route = result.value;

    const span = Context.getOption(context, Tracer.ParentSpan);
    if (span._tag === "Some" && span.value._tag === "Span") {
      span.value.attribute("consumer.route", route.topic);
    }

    return Effect.uninterruptible(Effect.scoped(route.handler));
  });
};

class RouteImpl<E = never, R = never> extends Inspectable.Class implements Router.Route<E, R> {
  readonly [RouteTypeId]: Router.RouteTypeId;
  constructor(
    readonly topic: Router.Route.Path,
    readonly handler: Router.Route.Handler<E, R>,
  ) {
    super();
    this[RouteTypeId] = RouteTypeId;
  }
  toJSON(): unknown {
    return {
      _id: "effect-kafka/MessageRouter/Route",
      topic: this.topic,
    };
  }
}

/** @internal */
export const empty: Router.MessageRouter<never> = new RouterImpl<never>(Chunk.empty());

/** @internal */
export const fromIterable = <R extends Router.Route<any, any>>(
  routes: Iterable<R>,
): Router.MessageRouter<
  R extends Router.Route<infer E, infer _> ? E : never,
  R extends Router.Route<infer _, infer Env> ? Env : never
> => new RouterImpl(Chunk.fromIterable(routes));

/** @internal */
export const makeRoute = <E, R>(
  topic: Router.Route.Path,
  handler: Router.Route.Handler<E, R>,
): Router.Route<E, Router.MessageRouter.ExcludeProvided<R>> => new RouteImpl(topic, handler) as any;

/** @internal */
export const append = dual<
  <R1, E1>(
    route: Router.Route<E1, R1>,
  ) => <E, R>(
    self: Router.MessageRouter<E, R>,
  ) => Router.MessageRouter<E | E1, R | Router.MessageRouter.ExcludeProvided<R1>>,
  <E, R, E1, R1>(
    self: Router.MessageRouter<E, R>,
    route: Router.Route<E1, R1>,
  ) => Router.MessageRouter<E | E1, R | Router.MessageRouter.ExcludeProvided<R1>>
>(2, (self, route) => new RouterImpl(Chunk.append(self.routes, route) as any) as any);

/** @internal */
export const concat = dual<
  <R1, E1>(
    that: Router.MessageRouter<E1, R1>,
  ) => <E, R>(self: Router.MessageRouter<E, R>) => Router.MessageRouter<E | E1, R | R1>,
  <E, R, E1, R1>(
    self: Router.MessageRouter<E, R>,
    that: Router.MessageRouter<E1, R1>,
  ) => Router.MessageRouter<E | E1, R | R1>
>(2, (self, that) => concatAll(self, that) as any);

/** @internal */
export const concatAll = <Routers extends ReadonlyArray<Router.MessageRouter<E, R>>, E, R>(...routers: Routers) =>
  new RouterImpl(routers.reduce((cur, acc) => Chunk.appendAll(cur, acc.routes), Chunk.empty<Router.Route<E, R>>()));

/** @internal */
export const subscribe = dual<
  <E1, R1>(
    topic: Router.Route.Path,
    handler: Router.Route.Handler<E1, R1>,
  ) => <E, R>(
    self: Router.MessageRouter<E, R>,
  ) => Router.MessageRouter<E | E1, R | Router.MessageRouter.ExcludeProvided<R1>>,
  <E, R, E1, R1>(
    self: Router.MessageRouter<E, R>,
    topic: Router.Route.Path,
    handler: Router.Route.Handler<E1, R1>,
  ) => Router.MessageRouter<E | E1, R | Router.MessageRouter.ExcludeProvided<R1>>
>(
  (args) => isRouter(args[0]),
  (self, topic, handler) => new RouterImpl<any, any>(Chunk.append(self.routes, new RouteImpl(topic, handler))),
);

/** @internal */
export const transform = dual<
  <E, R, R1, E1>(
    f: (self: Router.Route.Handler<E, R>) => App.Default<E1, R1>,
  ) => (self: Router.MessageRouter<E, R>) => Router.MessageRouter<E1, Router.MessageRouter.ExcludeProvided<R1>>,
  <E, R, R1, E1>(
    self: Router.MessageRouter<E, R>,
    f: (self: Router.Route.Handler<E, R>) => App.Default<E1, R1>,
  ) => Router.MessageRouter<E1, Router.MessageRouter.ExcludeProvided<R1>>
>(
  2,
  (self, f) =>
    new RouterImpl<any, any>(Chunk.map(self.routes, (route) => new RouteImpl(route.topic, f(route.handler)))),
);

/** @internal */
export const catchAll = dual<
  <E, E2, R2>(
    f: (e: E) => Router.Route.Handler<E2, R2>,
  ) => <R>(self: Router.MessageRouter<E, R>) => Router.MessageRouter<E2, R | Router.MessageRouter.ExcludeProvided<R2>>,
  <E, R, E2, R2>(
    self: Router.MessageRouter<E, R>,
    f: (e: E) => Router.Route.Handler<E2, R2>,
  ) => Router.MessageRouter<E2, R | Router.MessageRouter.ExcludeProvided<R2>>
>(2, (self, f) => transform(self, Effect.catchAll(f)));

/** @internal */
export const catchAllCause = dual<
  <E, E2, R2>(
    f: (e: Cause.Cause<E>) => Router.Route.Handler<E2, R2>,
  ) => <R>(self: Router.MessageRouter<E, R>) => Router.MessageRouter<E2, R | Router.MessageRouter.ExcludeProvided<R2>>,
  <E, R, E2, R2>(
    self: Router.MessageRouter<E, R>,
    f: (e: Cause.Cause<E>) => Router.Route.Handler<E2, R2>,
  ) => Router.MessageRouter<E2, R | Router.MessageRouter.ExcludeProvided<R2>>
>(2, (self, f) => transform(self, Effect.catchAllCause(f)));

/** @internal */
export const catchTag = dual<
  <K extends E extends { _tag: string } ? E["_tag"] : never, E, E1, R1>(
    k: K,
    f: (e: Extract<E, { _tag: K }>) => Router.Route.Handler<E1, R1>,
  ) => <R>(
    self: Router.MessageRouter<E, R>,
  ) => Router.MessageRouter<Exclude<E, { _tag: K }> | E1, R | Router.MessageRouter.ExcludeProvided<R1>>,
  <E, R, K extends E extends { _tag: string } ? E["_tag"] : never, E1, R1>(
    self: Router.MessageRouter<E, R>,
    k: K,
    f: (e: Extract<E, { _tag: K }>) => Router.Route.Handler<E1, R1>,
  ) => Router.MessageRouter<Exclude<E, { _tag: K }> | E1, R | Router.MessageRouter.ExcludeProvided<R1>>
>(3, (self, k, f) => transform(self, Effect.catchTag(k, f)));

/** @internal */
export const catchTags: {
  <
    E,
    Cases extends E extends { _tag: string }
      ? { [K in E["_tag"]]+?: (error: Extract<E, { _tag: K }>) => Router.Route.Handler<any, any> }
      : {},
  >(
    cases: Cases,
  ): <R>(self: Router.MessageRouter<E, R>) => Router.MessageRouter<
    | Exclude<E, { _tag: keyof Cases }>
    | {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        [K in keyof Cases]: Cases[K] extends (...args: Array<any>) => Effect.Effect<any, infer E, any> ? E : never;
      }[keyof Cases],
    | R
    | Router.MessageRouter.ExcludeProvided<
        {
          // eslint-disable-next-line @typescript-eslint/no-shadow
          [K in keyof Cases]: Cases[K] extends (...args: Array<any>) => Effect.Effect<any, any, infer R> ? R : never;
        }[keyof Cases]
      >
  >;
  <
    R,
    E,
    Cases extends E extends { _tag: string }
      ? {
          [K in E["_tag"]]+?: (error: Extract<E, { _tag: K }>) => Router.Route.Handler<any, any>;
        }
      : {},
  >(
    self: Router.MessageRouter<E, R>,
    cases: Cases,
  ): Router.MessageRouter<
    | Exclude<E, { _tag: keyof Cases }>
    | {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        [K in keyof Cases]: Cases[K] extends (...args: Array<any>) => Effect.Effect<any, infer E, any> ? E : never;
      }[keyof Cases],
    | R
    | Router.MessageRouter.ExcludeProvided<
        {
          // eslint-disable-next-line @typescript-eslint/no-shadow
          [K in keyof Cases]: Cases[K] extends (...args: Array<any>) => Effect.Effect<any, any, infer R> ? R : never;
        }[keyof Cases]
      >
  >;
} = dual(2, (self: Router.MessageRouter<any, any>, cases: {}) => transform(self, Effect.catchTags(cases)));

export const provideService = dual<
  <T extends Context.Tag<any, any>>(
    tag: T,
    service: Context.Tag.Service<T>,
  ) => <E, R>(self: Router.MessageRouter<E, R>) => Router.MessageRouter<E, Exclude<R, Context.Tag.Identifier<T>>>,
  <E, R, T extends Context.Tag<any, any>>(
    self: Router.MessageRouter<E, R>,
    tag: T,
    service: Context.Tag.Service<T>,
  ) => Router.MessageRouter<E, Exclude<R, Context.Tag.Identifier<T>>>
>(
  3,
  <E, R, T extends Context.Tag<any, any>>(
    self: Router.MessageRouter<E, R>,
    tag: T,
    service: Context.Tag.Service<T>,
  ): Router.MessageRouter<E, Exclude<R, Context.Tag.Identifier<T>>> =>
    transform(self, Effect.provideService(tag, service)),
);

/* @internal */
export const provideServiceEffect = dual<
  <T extends Context.Tag<any, any>, R1, E1>(
    tag: T,
    effect: Effect.Effect<Context.Tag.Service<T>, E1, R1>,
  ) => <E, R>(
    self: Router.MessageRouter<E, R>,
  ) => Router.MessageRouter<E | E1, Exclude<R | Router.MessageRouter.ExcludeProvided<R1>, Context.Tag.Identifier<T>>>,
  <E, R, T extends Context.Tag<any, any>, R1, E1>(
    self: Router.MessageRouter<E, R>,
    tag: T,
    effect: Effect.Effect<Context.Tag.Service<T>, E1, R1>,
  ) => Router.MessageRouter<E | E1, Exclude<R | Router.MessageRouter.ExcludeProvided<R1>, Context.Tag.Identifier<T>>>
>(
  3,
  <E, R, T extends Context.Tag<any, any>, R1, E1>(
    self: Router.MessageRouter<E, R>,
    tag: T,
    effect: Effect.Effect<Context.Tag.Service<T>, E1, R1>,
  ): Router.MessageRouter<E | E1, Exclude<R | Router.MessageRouter.ExcludeProvided<R1>, Context.Tag.Identifier<T>>> =>
    transform(self, Effect.provideServiceEffect(tag, effect)) as any,
);

const makeService = <E, R>(): Router.MessageRouter.Service<E, R> => {
  let router = empty as Router.MessageRouter<E, R>;
  return {
    addRoute(route) {
      return Effect.sync(() => {
        router = append(router, route);
      });
    },
    subscribe(path, handler) {
      return Effect.sync(() => {
        router = subscribe(router, path, handler);
      });
    },
    router: Effect.sync(() => router),
    concat(that) {
      return Effect.sync(() => {
        router = concat(router, that);
      });
    },
  };
};

/* @internal */
export const Tag =
  <const Name extends string>(id: Name) =>
  <Self, R = never, E = unknown>(): Router.MessageRouter.TagClass<Self, Name, E, R> => {
    const Err = globalThis.Error as any;
    const limit = Err.stackTraceLimit;
    Err.stackTraceLimit = 2;
    const creationError = new Err();
    Err.stackTraceLimit = limit;

    function TagClass() {}
    const TagClass_ = TagClass as any as Mutable<Router.MessageRouter.TagClass<Self, Name, E, R>>;
    Object.setPrototypeOf(TagClass, Object.getPrototypeOf(Context.GenericTag<Self, any>(id)));
    TagClass.key = id;
    Object.defineProperty(TagClass, "stack", {
      get() {
        return creationError.stack;
      },
    });
    TagClass_.Live = Layer.sync(TagClass_, makeService);
    TagClass_.router = Effect.flatMap(TagClass_, (_) => _.router);
    TagClass_.use = (f) => Layer.effectDiscard(Effect.flatMap(TagClass_, f)).pipe(Layer.provide(TagClass_.Live));
    TagClass_.useScoped = (f) => TagClass_.pipe(Effect.flatMap(f), Layer.scopedDiscard, Layer.provide(TagClass_.Live));
    TagClass_.unwrap = (f) =>
      TagClass_.pipe(
        Effect.flatMap((_) => _.router),
        Effect.map(f),
        Layer.unwrapEffect,
        Layer.provide(TagClass_.Live),
      );
    return TagClass as any;
  };
