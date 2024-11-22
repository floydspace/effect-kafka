/**
 * @since 0.4.3
 */
import { Effect, Layer, PubSub, Queue, Scope } from "effect";
import * as Consumer from "./Consumer.js";
import * as ConsumerRecord from "./ConsumerRecord.js";
import * as KafkaInstance from "./KafkaInstance.js";
import type * as MessageRouter from "./MessageRouter.js";
import * as Producer from "./Producer.js";

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

          return Consumer.make({
            subscribe: (topics) =>
              Effect.gen(function* () {
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
              }),
            consume: () => Effect.succeed(queue),
          });
        }),
    });
  });

/**
 * @since 0.4.3
 * @category layers
 */
export const layer = () => Layer.scoped(KafkaInstance.KafkaInstance, make());
