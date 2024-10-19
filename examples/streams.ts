import * as KafkaLib from "@confluentinc/kafka-javascript";
import { NodeRuntime } from "@effect/platform-node";
import { Context, Effect, Layer, Queue, Stream, Option } from "effect";

type TConsumerTopicObject = {
  topic: string;
  groupId: string;
};
class KafkaStreamConsumerTopic extends Context.Tag("@superwall/open-revenue-transformer/KafkaStreamConsumer/Topic")<
  KafkaStreamConsumerTopic,
  TConsumerTopicObject
>() {}

const makeKafkaStreamConsumer = Effect.gen(function* () {
  const { topic, groupId } = yield* KafkaStreamConsumerTopic;
  const kafka = new KafkaLib.KafkaJS.Kafka({
    kafkaJS: {
      brokers: ["localhost:19092"],
    },
  });

  const aquireConsumptionStream = Effect.gen(function* () {
    const consumer = kafka.consumer({
      kafkaJS: {
        autoCommit: false,
        groupId,
        fromBeginning: true,
      },
    });
    yield* Effect.log("Connecting to Kafka");
    yield* Effect.tryPromise(() => consumer.connect());
    yield* Effect.log("Subscribing to topic");
    yield* Effect.tryPromise(() =>
      consumer.subscribe({
        topic,
      }),
    );
    yield* Effect.log("Aqcuiring queue");
    const queue = yield* Queue.bounded<KafkaLib.KafkaJS.EachBatchPayload>(1);
    yield* Effect.log("Returning consumer and queue");
    return { consumer, queue };
  });

  const stream = Stream.acquireRelease(aquireConsumptionStream, ({ consumer, queue }) =>
    Effect.uninterruptible(
      Effect.all([
        Effect.tryPromise(() => consumer.disconnect())
          .pipe(
            Effect.catchAllCause((cause) => {
              return Effect.succeed(undefined).pipe(Effect.tap(() => Effect.log("Disconnected consumer cause", cause)));
            }),
          )
          .pipe(
            Effect.tap((result) => Effect.log("Disconnected consumer result", result)),
            Effect.andThen(Queue.awaitShutdown(queue)),
          ),
      ]),
    ),
  ).pipe(
    Stream.flatMap(({ consumer, queue }) => {
      void consumer.run({
        eachBatch: async (batch) => {
          return Effect.runPromise(
            Effect.gen(function* () {
              yield* Queue.offer(queue, batch);
            }),
          );
        },
      });
      return Stream.fromQueue(queue).pipe(
        Stream.zipWithPrevious,
        Stream.mapEffect(([previous, current]) =>
          Effect.gen(function* () {
            const previousIsAvailable = Option.isSome(previous);
            yield* Effect.log("Previous is available", previousIsAvailable);
            if (previousIsAvailable) {
              yield* Effect.log(
                "Committing messages",
                `topic: ${previous.value.batch.topic}, partition: ${previous.value.batch.partition}, firstOffset: ${previous.value.batch.firstOffset()}, highWatermark: ${previous.value.batch.highWatermark}`,
              );
              yield* Effect.tryPromise(() => previous.value.commitOffsetsIfNecessary());
            }
            yield* Effect.log(
              "Returning next messages.",
              `topic: ${current.batch.topic}, partition: ${current.batch.partition}, firstOffset: ${current.batch.firstOffset()}, highWatermark: ${current.batch.highWatermark}`,
            );
            return current;
          }),
        ),
      );
    }),
  );
  return {
    stream,
  };
});

type TKafkaStreamConsumer = Effect.Effect.Success<typeof makeKafkaStreamConsumer>;

export class KafkaStreamConsumer extends Context.Tag("@superwall/open-revenue-transformer/KafkaStreamConsumer")<
  KafkaStreamConsumer,
  TKafkaStreamConsumer
>() {}

//
// Topic & Group Definitions
//

//  AppStoreServer
export const KafkaStreamConsumerAppStoreServerLive = Layer.effect(
  KafkaStreamConsumer,
  makeKafkaStreamConsumer.pipe(
    Effect.provideService(KafkaStreamConsumerTopic, {
      topic: "com.superwall.events.IntegrationEvents.v1.AppStoreConnect.Valid",
      groupId: "open-revenue-transformer-group-1234",
    }),
  ),
);

//  RevenueCat
export const KafkaStreamConsumerRevenueCatLive = Layer.effect(
  KafkaStreamConsumer,
  makeKafkaStreamConsumer.pipe(
    Effect.provideService(KafkaStreamConsumerTopic, {
      topic: "com.superwall.events.IntegrationEvents.v1.RevenueCat.Valid",
      groupId: "open-revenue-transformer-group",
    }),
  ),
);

//  RevenueCat
export const TestLive = Layer.effect(
  KafkaStreamConsumer,
  makeKafkaStreamConsumer.pipe(
    Effect.provideService(KafkaStreamConsumerTopic, {
      topic: "test-topic",
      groupId: "group",
    }),
  ),
);

const Main = KafkaStreamConsumer.pipe(
  Effect.andThen((x) => Stream.runCollect(x.stream)),
  Effect.tap((x) => Effect.log("Stream result", x)),
  Effect.provide(TestLive),
);

NodeRuntime.runMain(Main);
