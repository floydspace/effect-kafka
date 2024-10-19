import { KafkaJS } from "@confluentinc/kafka-javascript";
import { NodeRuntime } from "@effect/platform-node";
import { Console, Effect, Layer } from "effect";
import { ConfluentKafkaJSConsumer, Consumer, MessagePayload, MessageRouter } from "../src";

const ConsumerLive = MessageRouter.empty.pipe(
  MessageRouter.subscribe(
    "test-topic",
    Effect.flatMap(MessagePayload.MessagePayload, ({ topic, partition, message }) =>
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
    Effect.flatMap(MessagePayload.MessagePayload, ({ topic, partition, message }) =>
      Console.log({
        topic,
        partition,
        offset: message.offset,
        value: message.value?.toString(),
      }),
    ),
  ),
  Consumer.serve(),
);

const KafkaLive = ConfluentKafkaJSConsumer.layer(
  () => new KafkaJS.Kafka({ kafkaJS: { brokers: ["localhost:19092"] } }),
  { kafkaJS: { groupId: "group" } },
);
const MainLive = ConsumerLive.pipe(Layer.provide(KafkaLive));

NodeRuntime.runMain(Layer.launch(MainLive));
