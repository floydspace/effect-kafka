import { NodeRuntime } from "@effect/platform-node";
import { Effect } from "effect";
import { Producer } from "../src";
import { KafkaJS } from "../src/KafkaJS";

// const program = Effect.gen(function* () {
//   const p = yield* Producer.Producer;
//   return yield* p.send({
//     topic: "test-topic",
//     messages: [{ value: "Hello effect-kafka user!" }],
//   });
// }).pipe(Effect.provide(Producer.layer({ allowAutoTopicCreation: true })));

const program = Producer.send({
  topic: "test-topic",
  messages: [{ value: "Hello, effect-kafka user!" }, { value: "How are you, effect-kafka user?" }],
});

const ProducerLive = Producer.layer({ allowAutoTopicCreation: true });
const KafkaLive = KafkaJS.layer({ brokers: ["localhost:19092"] });
const MainLive = program.pipe(Effect.provide(ProducerLive), Effect.provide(KafkaLive));

NodeRuntime.runMain(MainLive);
