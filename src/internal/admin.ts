import { Context, Effect, Scope } from "effect";
import type * as Admin from "../Admin.js";
import { instanceTag } from "./kafkaInstance.js";
import type * as AdminError from "../AdminError.js";
import type * as Error from "../KafkaError.js";
import type * as KafkaInstance from "../KafkaInstance.js";

/** @internal */
export const TypeId: Admin.TypeId = Symbol.for("effect-kafka/Admin") as Admin.TypeId;

/** @internal */
export const adminTag = Context.GenericTag<Admin.Admin>("effect-kafka/Admin");

const adminProto = {
  [TypeId]: TypeId,
};

/** @internal */
export type AdminConstructorProps = {
  readonly listTopics: () => Effect.Effect<ReadonlyArray<string>, AdminError.AdminError, Scope.Scope>;
};

/** @internal */
export const make = (options: AdminConstructorProps): Admin.Admin => Object.assign(Object.create(adminProto), options);

/** @internal */
export const makeAdmin = (
  options: Admin.Admin.AdminOptions,
): Effect.Effect<Admin.Admin, Error.ConnectionException, KafkaInstance.KafkaInstance | Scope.Scope> =>
  Effect.gen(function* () {
    const instance = yield* instanceTag;
    return yield* instance.admin(options);
  });

/** @internal */
export const listTopics = () =>
  Effect.gen(function* () {
    const instance = yield* instanceTag;
    const admin = yield* instance.admin();
    return yield* admin.listTopics();
  });
