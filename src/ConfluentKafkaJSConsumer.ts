/**
 * @since 0.1.1
 */
import type { KafkaJS } from "@confluentinc/kafka-javascript";
import { Chunk, Effect, Layer, Runtime, Scope } from "effect";
import { LazyArg } from "effect/Function";
import * as Consumer from "./Consumer";
import * as ConsumerError from "./ConsumerError";
import * as MessagePayload from "./MessagePayload";

/**
 * @since 0.1.1
 * @category constructors
 */
export const make = (
  evaluate: LazyArg<KafkaJS.Kafka>,
  options: KafkaJS.ConsumerConstructorConfig,
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

          const eachMessage: KafkaJS.EachMessageHandler = yield* Effect.map(Effect.runtime<never>(), (runtime) => {
            const runPromise = Runtime.runPromise(runtime);
            return (payload: KafkaJS.EachMessagePayload) =>
              app.pipe(Effect.provideService(MessagePayload.MessagePayload, MessagePayload.make(payload)), runPromise);
          });

          yield* Effect.promise(() => consumer.run({ eachMessage }));
        }),
    });
  });

/**
 * @since 0.1.1
 * @category layers
 */
export const layer = (evaluate: LazyArg<KafkaJS.Kafka>, options: KafkaJS.ConsumerConstructorConfig) =>
  Layer.scoped(Consumer.Consumer, make(evaluate, options));
