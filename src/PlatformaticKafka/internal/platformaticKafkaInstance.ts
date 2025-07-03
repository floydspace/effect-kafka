import {
  Admin,
  AdminOptions,
  ConsumeOptions,
  Consumer,
  ConsumerOptions,
  MessagesStream,
  Producer,
  ProduceResult,
  ProducerOptions,
  SendOptions,
} from "@platformatic/kafka";
import { Effect, Scope } from "effect";
import * as AdminError from "../../AdminError.js";
import * as ProducerError from "../../ProducerError.js";

/** @internal */
export const listTopics = (admin: Admin): Effect.Effect<ReadonlyArray<string>, AdminError.UnknownAdminError> =>
  Effect.dieMessage("Not implemented");

/** @internal */
export const send = <Key = Buffer, Value = Buffer, HeaderKey = Buffer, HeaderValue = Buffer>(
  producer: Producer<Key, Value, HeaderKey, HeaderValue>,
  record: SendOptions<Key, Value, HeaderKey, HeaderValue>,
): Effect.Effect<ProduceResult, ProducerError.UnknownProducerError> =>
  Effect.tryPromise(() => producer.send(record)).pipe(
    Effect.catchAll((err) => new ProducerError.UnknownProducerError(err)),
  );

/** @internal */
export const consume = <Key = Buffer, Value = Buffer, HeaderKey = Buffer, HeaderValue = Buffer>(
  consumer: Consumer<Key, Value, HeaderKey, HeaderValue>,
  config: ConsumeOptions<Key, Value, HeaderKey, HeaderValue>,
): Effect.Effect<MessagesStream<Key, Value, HeaderKey, HeaderValue>> => Effect.promise(() => consumer.consume(config));

/** @internal */
export const connectAdminScoped = (options: AdminOptions): Effect.Effect<Admin, never, Scope.Scope> =>
  Effect.acquireRelease(
    Effect.sync(() => new Admin(options)),
    (admin) => Effect.promise(() => admin.close()),
  );

/** @internal */
export const connectProducerScoped = <Key = Buffer, Value = Buffer, HeaderKey = Buffer, HeaderValue = Buffer>(
  options: ProducerOptions<Key, Value, HeaderKey, HeaderValue>,
): Effect.Effect<Producer<Key, Value, HeaderKey, HeaderValue>, never, Scope.Scope> =>
  Effect.acquireRelease(
    Effect.sync(() => new Producer<Key, Value, HeaderKey, HeaderValue>(options)),
    (producer) => Effect.promise(() => producer.close()),
  );

/** @internal */
export const connectConsumerScoped = <Key = Buffer, Value = Buffer, HeaderKey = Buffer, HeaderValue = Buffer>(
  options: ConsumerOptions<Key, Value, HeaderKey, HeaderValue>,
): Effect.Effect<Consumer<Key, Value, HeaderKey, HeaderValue>, never, Scope.Scope> =>
  Effect.acquireRelease(
    Effect.sync(() => new Consumer<Key, Value, HeaderKey, HeaderValue>(options)),
    (consumer) => Effect.promise(() => consumer.close()),
  );
