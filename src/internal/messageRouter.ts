import { Chunk, Context, Effect, Effectable, FiberRef, Inspectable, Option, Predicate, Tracer } from "effect";
import { dual } from "effect/Function";
import * as Error from "../ConsumerError";
import * as MessagePayload from "../MessagePayload";
import type * as Router from "../MessageRouter";

/** @internal */
export const TypeId: Router.TypeId = Symbol.for("effect-kafka/MessageRouter") as Router.TypeId;

/** @internal */
export const RouteTypeId: Router.RouteTypeId = Symbol.for("effect-kafka/MessageRouter/Route") as Router.RouteTypeId;

const isRouter = (u: unknown): u is Router.MessageRouter<unknown, unknown> => Predicate.hasProperty(u, TypeId);

class RouterImpl<E = never, R = never>
  extends Effectable.StructuralClass<void, E | Error.RouteNotFound, R>
  implements Router.MessageRouter<E, R>
{
  readonly [TypeId]: Router.TypeId;
  private consumerApp: Effect.Effect<void, E | Error.RouteNotFound, R>;
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

const toConsumerApp = <E, R>(self: Router.MessageRouter<E, R>): Router.Default<E | Error.RouteNotFound, R> => {
  return Effect.withFiberRuntime<void, E | Error.RouteNotFound, R>((fiber) => {
    const context = fiber.getFiberRef(FiberRef.currentContext);
    const payload = Context.unsafeGet(context, MessagePayload.MessagePayload);

    let result = Chunk.findFirst(self.routes, (route) => route.topic === payload.topic); // TODO: match regex
    if (Option.isNone(result)) {
      return Effect.fail(new Error.RouteNotFound({ payload }));
    }
    const route = result.value;

    const span = Context.getOption(context, Tracer.ParentSpan);
    if (span._tag === "Some" && span.value._tag === "Span") {
      span.value.attribute("consumer.route", route.topic);
    }

    return Effect.interruptible(route.handler) as Effect.Effect<void, E, Router.MessageRouter.ExcludeProvided<R>>;
  });
};

class RouteImpl<E = never, R = never> extends Inspectable.Class implements Router.Route<E, R> {
  readonly [RouteTypeId]: Router.RouteTypeId;
  constructor(
    readonly topic: Router.Route.Path,
    readonly handler: Router.Route.Handler<E, R>,
    readonly fromBeginning = false,
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
  options?: { readonly fromBeginning?: boolean | undefined } | undefined,
): Router.Route<E, Router.MessageRouter.ExcludeProvided<R>> =>
  new RouteImpl(topic, handler, options?.fromBeginning ?? false) as any;

const route = (): {
  <R1, E1>(
    topic: Router.Route.Path,
    handler: Router.Route.Handler<E1, R1>,
    options?: { readonly fromBeginning?: boolean | undefined } | undefined,
  ): <E, R>(
    self: Router.MessageRouter<E, R>,
  ) => Router.MessageRouter<E1 | E, R | Router.MessageRouter.ExcludeProvided<R1>>;
  <E, R, E1, R1>(
    self: Router.MessageRouter<E, R>,
    topic: Router.Route.Path,
    handler: Router.Route.Handler<E1, R1>,
    options?: { readonly fromBeginning?: boolean | undefined } | undefined,
  ): Router.MessageRouter<E1 | E, R | Router.MessageRouter.ExcludeProvided<R1>>;
} =>
  dual<
    <R1, E1>(
      topic: Router.Route.Path,
      handler: Router.Route.Handler<R1, E1>,
    ) => <E, R>(
      self: Router.MessageRouter<E, R>,
    ) => Router.MessageRouter<E | E1, R | Router.MessageRouter.ExcludeProvided<R1>>,
    <E, R, E1, R1>(
      self: Router.MessageRouter<E, R>,
      topic: Router.Route.Path,
      handler: Router.Route.Handler<E1, R1>,
      options?: { readonly fromBeginning?: boolean | undefined } | undefined,
    ) => Router.MessageRouter<E | E1, R | Router.MessageRouter.ExcludeProvided<R1>>
  >(
    (args) => isRouter(args[0]),
    (self, topic, handler, options) =>
      new RouterImpl<any, any>(
        Chunk.append(self.routes, new RouteImpl(topic, handler, options?.fromBeginning ?? false)),
      ),
  );

/** @internal */
export const subscribe = route();
