import { NodeRuntime } from "@effect/platform-node";
import { Console, Effect, Layer, Logger, LogLevel } from "effect";
import { ConfluentRdKafkaInstance, Consumer, ConsumerRecord, MessageRouter } from "../src";

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

const KafkaLive = ConfluentRdKafkaInstance.layer({ "metadata.broker.list": "localhost:19092" });
const MainLive = ConsumerLive.pipe(Layer.provide(KafkaLive));

NodeRuntime.runMain(Layer.launch(MainLive).pipe(Logger.withMinimumLogLevel(LogLevel.Debug)));
