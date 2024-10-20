import { NodeRuntime } from "@effect/platform-node";
import { Console, Effect, Layer } from "effect";
import { Consumer, KafkaJSInstance, MessagePayload, MessageRouter } from "../src";

const ConsumerLive = MessageRouter.empty.pipe(
  MessageRouter.subscribe(
    "test-topic",
    Effect.flatMap(MessagePayload.MessagePayload, ({ topic: _, partition, message }) =>
      Console.log({
        partition,
        offset: message.offset,
        value: message.value?.toString(),
      }),
    ),
  ),
  Consumer.serve({ groupId: "group" }),
);

const KafkaLive = KafkaJSInstance.layer({ brokers: ["localhost:19092"] });
const MainLive = ConsumerLive.pipe(Layer.provide(KafkaLive));

NodeRuntime.runMain(Layer.launch(MainLive));
