/**
 * @since 0.4.3
 */
import { Array, Chunk, Effect, Fiber, Layer, PubSub, Queue, Scope, Stream } from "effect";
import * as Consumer from "./Consumer";
import * as ConsumerRecord from "./ConsumerRecord";
import * as KafkaInstance from "./KafkaInstance";
import type * as MessageRouter from "./MessageRouter";
import * as Producer from "./Producer";

let offset = 0;

const mapProducerToConsumerRecords = (record: Producer.Producer.ProducerRecord): ConsumerRecord.ConsumerRecord[] =>
  record.messages.map((message) =>
    ConsumerRecord.make({
      topic: record.topic,
      partition: message.partition ?? 0,
      highWatermark: "0",
      key: typeof message.key === "string" ? Buffer.from(message.key) : (message.key ?? null),
      value: typeof message.value === "string" ? Buffer.from(message.value) : (message.value ?? null),
      timestamp: message.timestamp ?? Date.now().toString(),
      attributes: 0,
      offset: (offset++).toString(),
      headers: message.headers,
      commit: () => Effect.void,
      heartbeat: () => Effect.void,
    }),
  );

const matchTopic = (topicPath: MessageRouter.Route.Path, topic: string) => {
  if (typeof topicPath === "string") {
    return topicPath === topic;
  }
  return topicPath.test(topic);
};

const matchAnyTopic = (topics: MessageRouter.Route.Path[], topic: string) =>
  !topics.every((t) => !matchTopic(t, topic));

/**
 * @since 0.4.3
 * @category constructors
 */
export const make = (): Effect.Effect<KafkaInstance.KafkaInstance, never, Scope.Scope> =>
  Effect.gen(function* () {
    const pubSub = yield* Effect.acquireRelease(
      PubSub.bounded<Producer.Producer.ProducerRecord>(1).pipe(Effect.tap(() => Effect.logInfo("PubSub acquired"))),
      (q) =>
        q.shutdown.pipe(
          Effect.tap(() => q.awaitShutdown),
          Effect.tap(() => Effect.logInfo("PubSub released")),
        ),
    );

    return KafkaInstance.make({
      producer: () =>
        Effect.gen(function* () {
          return Producer.make({
            send: (record) => pubSub.publish(record).pipe(Effect.as<Producer.Producer.RecordMetadata[]>([])),
            sendBatch: (batch) =>
              pubSub.publishAll(batch.topicMessages ?? []).pipe(Effect.as<Producer.Producer.RecordMetadata[]>([])),
          });
        }),
      consumer: () =>
        Effect.gen(function* () {
          const subscribeAndConsume = (topics: MessageRouter.Route.Path[]) =>
            Effect.gen(function* () {
              const queue = yield* Effect.acquireRelease(
                Queue.bounded<ConsumerRecord.ConsumerRecord>(1).pipe(
                  Effect.tap(() => Effect.logInfo("Consumer Queue acquired")),
                ),
                (q) =>
                  q.shutdown.pipe(
                    Effect.tap(() => q.awaitShutdown),
                    Effect.tap(() => Effect.logInfo("Consumer Queue released")),
                  ),
              );

              const subscription = yield* pubSub.subscribe;

              yield* subscription.pipe(
                Effect.tap((record) =>
                  matchAnyTopic(topics, record.topic)
                    ? queue.offerAll(mapProducerToConsumerRecords(record))
                    : Effect.void,
                ),
                Effect.forever,
                Effect.forkScoped,
              );

              return queue;
            });

          return Consumer.make({
            run: (app) =>
              Effect.gen(function* () {
                const topics = Chunk.toArray(app.routes).map((route) => route.topic);

                const queue = yield* subscribeAndConsume(topics);

                const fiber = yield* app.pipe(
                  Effect.provideServiceEffect(ConsumerRecord.ConsumerRecord, queue),
                  Effect.forever,
                  Effect.fork,
                );

                yield* Fiber.join(fiber);
              }).pipe(Effect.scoped),
            runStream: (topic) =>
              subscribeAndConsume(Array.of(topic)).pipe(Effect.map(Stream.fromQueue), Stream.scoped, Stream.flatten()),
          });
        }),
    });
  });

/**
 * @since 0.4.3
 * @category layers
 */
export const layer = () => Layer.scoped(KafkaInstance.KafkaInstance, make());