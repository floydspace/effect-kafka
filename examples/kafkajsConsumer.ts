import { NodeRuntime } from "@effect/platform-node";
import { Console, Effect, Layer } from "effect";
import { ConfluentKafkaJSInstance, Consumer, ConsumerRecord, MessageRouter } from "../src";

const ConsumerLive = MessageRouter.empty.pipe(
  MessageRouter.subscribe(
    "test-topic",
    Effect.flatMap(ConsumerRecord.ConsumerRecord, ({ topic, partition, ...message }) =>
      Console.log({
        topic,
        partition,
        offset: message.offset,
        value: message.value?.toString(),
      }),
    ),
  ),
  MessageRouter.subscribe(
    "customers",
    Effect.flatMap(ConsumerRecord.ConsumerRecord, ({ topic, partition, ...message }) =>
      Console.log({
        topic,
        partition,
        offset: message.offset,
        value: message.value?.toString(),
      }),
    ),
  ),
  Consumer.serve({ groupId: "group" }),
);

const KafkaLive = ConfluentKafkaJSInstance.layer({ brokers: ["localhost:19092"] });
const MainLive = ConsumerLive.pipe(Layer.provide(KafkaLive));

NodeRuntime.runMain(Layer.launch(MainLive));
