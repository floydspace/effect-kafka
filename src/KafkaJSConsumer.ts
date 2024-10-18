/**
 * @since 0.1.0
 */
import { Chunk, Effect, Layer, Runtime, Scope } from "effect";
import { LazyArg } from "effect/Function";
import { ConsumerConfig, EachMessageHandler, EachMessagePayload, Kafka } from "kafkajs";
import * as Consumer from "./Consumer";
import * as ConsumerError from "./ConsumerError";
import * as MessagePayload from "./MessagePayload";

/**
 * @since 0.1.0
 * @category constructors
 */
export const make = (
  evaluate: LazyArg<Kafka>,
  options: ConsumerConfig,
): Effect.Effect<Consumer.Consumer, ConsumerError.ConsumerError, Scope.Scope> =>
  Effect.gen(function* () {
    const consumer = yield* Effect.acquireRelease(
      Effect.sync(evaluate).pipe(
        Effect.map((kafka) => kafka.consumer(options)),
        Effect.tap((c) => c.connect()),
        Effect.orDie,
      ),
      (c) => Effect.promise(() => c.disconnect()),
    );

    return Consumer.make({
      run: (app) =>
        Effect.gen(function* () {
          const topics = Chunk.toArray(app.routes).map((route) => route.topic);
          yield* Effect.promise(() => consumer.subscribe({ topics }));

          const eachMessage: EachMessageHandler = yield* Effect.map(Effect.runtime<never>(), (runtime) => {
            const runPromise = Runtime.runPromise(runtime);
            return (payload: EachMessagePayload) =>
              app.pipe(Effect.provideService(MessagePayload.MessagePayload, MessagePayload.make(payload)), runPromise);
          });

          yield* Effect.promise(() => consumer.run({ eachMessage }));
        }),
    });
  });

/**
 * @since 0.1.0
 * @category layers
 */
export const layer = (evaluate: LazyArg<Kafka>, options: ConsumerConfig) =>
  Layer.scoped(Consumer.Consumer, make(evaluate, options));
