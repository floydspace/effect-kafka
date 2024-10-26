import { NodeRuntime } from "@effect/platform-node";
import { Console, Effect, Stream } from "effect";
import { Consumer, KafkaJSInstance } from "../src";

const program = Consumer.serveStream("test-topic", { groupId: "group" }).pipe(
  Stream.runForEach(({ topic, partition, ...message }) =>
    Console.log({
      topic,
      partition,
      offset: message.offset,
      value: message.value?.toString(),
    }),
  ),
);

const KafkaLive = KafkaJSInstance.layer({ brokers: ["localhost:19092"] });
const MainLive = Effect.scoped(program).pipe(Effect.provide(KafkaLive));

NodeRuntime.runMain(MainLive);
