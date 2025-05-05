import {
  Admin,
  AdminOptions,
  Consumer,
  ConsumerOptions,
  MessagesStream,
  Producer,
  ProduceResult,
  ProducerOptions,
  SendOptions,
  StreamOptions,
} from "@platformatic/kafka";
import { Effect, Scope } from "effect";
import * as AdminError from "../../AdminError.js";
import * as ProducerError from "../../ProducerError.js";

/** @internal */
export const listTopics = (admin: Admin): Effect.Effect<ReadonlyArray<string>, AdminError.UnknownAdminError> =>
  Effect.dieMessage("Not implemented");

/** @internal */
export const send = (
  producer: Producer,
  record: SendOptions<Buffer, Buffer, Buffer, Buffer>,
): Effect.Effect<ProduceResult, ProducerError.UnknownProducerError> =>
  Effect.tryPromise(() => producer.send(record)).pipe(
    Effect.catchAll((err) => new ProducerError.UnknownProducerError(err)),
  );

/** @internal */
export const consume = (
  consumer: Consumer,
  config: StreamOptions,
): Effect.Effect<MessagesStream<Buffer, Buffer, Buffer, Buffer>> => Effect.promise(() => consumer.consume(config));

/** @internal */
export const connectAdminScoped = (options: AdminOptions): Effect.Effect<Admin, never, Scope.Scope> =>
  Effect.acquireRelease(
    Effect.sync(() => new Admin(options)),
    (admin) => Effect.promise(() => admin.close()),
  );

/** @internal */
export const connectProducerScoped = (
  options: ProducerOptions<Buffer, Buffer, Buffer, Buffer>,
): Effect.Effect<Producer, never, Scope.Scope> =>
  Effect.acquireRelease(
    Effect.sync(() => new Producer(options)),
    (producer) => Effect.promise(() => producer.close()),
  );

/** @internal */
export const connectConsumerScoped = (
  options: ConsumerOptions<Buffer, Buffer, Buffer, Buffer>,
): Effect.Effect<Consumer, never, Scope.Scope> =>
  Effect.acquireRelease(
    Effect.sync(() => new Consumer(options)),
    (consumer) => Effect.promise(() => consumer.close()),
  );
