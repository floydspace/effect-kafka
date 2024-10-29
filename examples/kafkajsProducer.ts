import { NodeRuntime } from "@effect/platform-node";
import { Effect } from "effect";
import { ConfluentKafkaJSInstance, Producer } from "../src";

const program = Producer.sendScoped({
  topic: "test-topic",
  messages: [{ value: "Hello effect-kafka user!" }],
}).pipe(Producer.withProducerOptions({ allowAutoTopicCreation: true }));

const KafkaLive = ConfluentKafkaJSInstance.layer({ brokers: ["localhost:19092"] });
const MainLive = Effect.scoped(program).pipe(Effect.provide(KafkaLive));

NodeRuntime.runMain(MainLive);
