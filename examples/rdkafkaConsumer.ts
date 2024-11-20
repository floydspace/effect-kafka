import { NodeRuntime } from "@effect/platform-node";
import { Console, Effect, Layer, Logger, LogLevel } from "effect";
import { Consumer, ConsumerRecord, MessageRouter } from "../src";
import { ConfluentRdKafka } from "../src/ConfluentKafka";

const ConsumerLive = MessageRouter.empty.pipe(
  MessageRouter.subscribe(
    "test-topic",
    Effect.flatMap(ConsumerRecord.ConsumerRecord, ({ topic: _, partition, ...message }) =>
      Console.log({
        partition,
        offset: message.offset,
        value: message.value?.toString(),
      }),
    ),
  ),
  Consumer.serve({ groupId: "group" }),
);

const KafkaLive = ConfluentRdKafka.layer({ "metadata.broker.list": "localhost:19092" });
const MainLive = ConsumerLive.pipe(Layer.provide(KafkaLive));

NodeRuntime.runMain(Layer.launch(MainLive).pipe(Logger.withMinimumLogLevel(LogLevel.Debug)));
