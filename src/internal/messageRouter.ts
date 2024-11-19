import { Chunk, Context, Effect, Effectable, FiberRef, Inspectable, Option, Predicate, Tracer } from "effect";
import { dual } from "effect/Function";
import * as Error from "../ConsumerError.js";
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
    this.consumerApp = toConsumerApp(this);
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

const toConsumerApp = <E, R>(self: Router.MessageRouter<E, R>): Effect.Effect<void, E, R> => {
  return Effect.withFiberRuntime<void, E, R>((fiber) => {
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

    return Effect.uninterruptible(Effect.scoped(route.handler)) as Effect.Effect<
      void,
      E,
      Router.MessageRouter.ExcludeProvided<R>
    >;
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
