import { NodeRuntime } from "@effect/platform-node";
import { Console, Effect, Layer } from "effect";
import { Consumer, ConsumerRecord, KafkaJSInstance, MessageRouter } from "../src";

const ConsumerLive = MessageRouter.empty.pipe(
  MessageRouter.subscribe(
    "test-topic",
    Effect.flatMap(ConsumerRecord.ConsumerRecord, ({ topic: _, partition, ...message }) =>
      Console.log({
        partition,
        ...message,
        key: message.key?.toString(),
        value: message.value?.toString(),
      }),
    ),
  ),
  Consumer.serve({ groupId: "group" }),
);

const KafkaLive = KafkaJSInstance.layer({ brokers: ["localhost:19092"] });
const MainLive = ConsumerLive.pipe(Layer.provide(KafkaLive));

NodeRuntime.runMain(Layer.launch(MainLive));
