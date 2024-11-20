import { NodeRuntime } from "@effect/platform-node";
import { Console, Effect, Stream } from "effect";
import { Consumer } from "../src";
import { KafkaJS } from "../src/KafkaJS";

const program = Consumer.serveStream("test-topic").pipe(
  Stream.runForEach(({ topic, partition, ...message }) =>
    Console.log({
      topic,
      partition,
      offset: message.offset,
      value: message.value?.toString(),
    }),
  ),
);

const ConsumerLive = Consumer.layer({ groupId: "group" });
const KafkaLive = KafkaJS.layer({ brokers: ["localhost:19092"] });
const MainLive = program.pipe(Effect.provide(ConsumerLive), Effect.provide(KafkaLive));

NodeRuntime.runMain(MainLive);
