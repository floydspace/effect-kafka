import { NodeRuntime } from "@effect/platform-node";
import { Console, Effect, Layer } from "effect";
import { Consumer, ConsumerRecord, MessageRouter } from "../src";
import { PlatformaticKafka } from "../src/PlatformaticKafka";

const ConsumerLive = MessageRouter.empty.pipe(
  MessageRouter.subscribe(
    "my-topic",
    Effect.flatMap(ConsumerRecord.ConsumerRecord, (message) =>
      Console.log(`Received: ${message.key} -> ${message.value}`),
    ),
  ),
  Consumer.serve({
    groupId: "my-consumer-group",
    autoCommit: true,
    sessionTimeout: 10000,
    heartbeatInterval: 500,
  }),
);

const KafkaLive = PlatformaticKafka.layer({
  clientId: "my-consumer",
  bootstrapBrokers: ["localhost:9092"],
});
const MainLive = ConsumerLive.pipe(Layer.provide(KafkaLive));

NodeRuntime.runMain(Layer.launch(MainLive));
