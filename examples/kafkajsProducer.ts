import { NodeRuntime } from "@effect/platform-node";
import { Effect } from "effect";
import { Producer } from "../src";
import { ConfluentKafkaJS } from "../src/ConfluentKafka";

const program = Producer.sendScoped({
  topic: "test-topic",
  messages: [{ value: "Hello effect-kafka user!" }],
}).pipe(Producer.withProducerOptions({ allowAutoTopicCreation: true }));

const KafkaLive = ConfluentKafkaJS.layer({ brokers: ["localhost:19092"] });
const MainLive = Effect.scoped(program).pipe(Effect.provide(KafkaLive));

NodeRuntime.runMain(MainLive);
