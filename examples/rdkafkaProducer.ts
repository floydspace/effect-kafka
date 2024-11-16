import { NodeRuntime } from "@effect/platform-node";
import { Effect, Logger, LogLevel } from "effect";
import { ConfluentRdKafkaInstance, Producer } from "../src";

const program = Producer.sendScoped({
  topic: "test-topic",
  messages: [{ value: "Hello, effect-kafka user!" }, { value: "How are you, effect-kafka user?" }],
}).pipe(Producer.withProducerOptions({ allowAutoTopicCreation: true }));

const KafkaLive = ConfluentRdKafkaInstance.layer({ "metadata.broker.list": "localhost:19092" });
const MainLive = Effect.scoped(program).pipe(Effect.provide(KafkaLive), Logger.withMinimumLogLevel(LogLevel.Debug));

NodeRuntime.runMain(MainLive);
