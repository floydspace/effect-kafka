import { NodeRuntime } from "@effect/platform-node";
import { Context, Effect, Layer, Option, Stream } from "effect";
import { Consumer } from "../src";
import { ConfluentKafkaJS } from "../src/ConfluentKafka";

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

  const stream = Consumer.serveStream(topic).pipe(
    Stream.zipWithPrevious,
    Stream.mapEffect(([previous, current]) =>
      Effect.gen(function* () {
        const previousIsAvailable = Option.isSome(previous);
        yield* Effect.log("Previous is available", previousIsAvailable);
        if (previousIsAvailable) {
          yield* Effect.log(
            "Committing messages",
            `topic: ${previous.value.topic}, partition: ${previous.value.partition}, firstOffset: ${previous.value.offset}, highWatermark: ${previous.value.highWatermark}`,
          );
          yield* previous.value.commit();
        }
        yield* Effect.log(
          "Returning next messages.",
          `topic: ${current.topic}, partition: ${current.partition}, firstOffset: ${current.offset}, highWatermark: ${current.highWatermark}`,
        );
        return current;
      }),
    ),
    Stream.provideSomeLayer(
      Consumer.layer({
        autoCommit: false,
        groupId,
        fromBeginning: true,
      }),
    ),
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
  Effect.provide(ConfluentKafkaJS.layer({ brokers: ["localhost:19092"] })),
);

NodeRuntime.runMain(Main);
