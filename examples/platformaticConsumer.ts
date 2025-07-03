import { NodeRuntime } from "@effect/platform-node";
import { Console, Effect, Layer } from "effect";
import { Consumer, ConsumerRecord, MessageRouter } from "../src";
import { PlatformaticKafka } from "../src/PlatformaticKafka";

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

const KafkaLive = PlatformaticKafka.layer({ clientId: "my-consumer", bootstrapBrokers: ["localhost:29092"] });
const MainLive = ConsumerLive.pipe(Layer.provide(KafkaLive));

NodeRuntime.runMain(Layer.launch(MainLive));
