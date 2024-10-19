import { KafkaConsumer } from "@confluentinc/kafka-javascript";
import { NodeRuntime } from "@effect/platform-node";
import { Console, Effect, Layer } from "effect";
import { ConfluentRdKafkaConsumer, Consumer, MessagePayload, MessageRouter } from "../src";

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
  Consumer.serve(),
);

const KafkaLive = ConfluentRdKafkaConsumer.layer(
  () =>
    new KafkaConsumer({
      "group.id": "group",
      "metadata.broker.list": "localhost:19092",
    }),
);
const MainLive = ConsumerLive.pipe(Layer.provide(KafkaLive));

NodeRuntime.runMain(Layer.launch(MainLive));
