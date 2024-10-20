import { NodeRuntime } from "@effect/platform-node";
import { Effect } from "effect";
import { KafkaJSInstance, Producer } from "../src";

// const program = Effect.gen(function* () {
//   const p = yield* Producer.Producer;
//   return yield* p.send({
//     topic: "test-topic",
//     messages: [{ value: "Hello effect-kafka user!" }],
//   });
// }).pipe(Effect.provide(Producer.layer({ allowAutoTopicCreation: true })));

const program = Producer.send({
  topic: "test-topic",
  messages: [{ value: "Hello effect-kafka user!" }],
}).pipe(Producer.withProducerOptions({ allowAutoTopicCreation: true }));

const KafkaLive = KafkaJSInstance.layer({ brokers: ["localhost:19092"] });
const MainLive = Effect.scoped(program).pipe(Effect.provide(KafkaLive));

NodeRuntime.runMain(MainLive);
