import { NodeRuntime } from "@effect/platform-node";
import { Clock, Console, Effect, Schedule, Stream } from "effect";
import { ConfluentKafkaJSInstance, Consumer, Producer } from "../src";

const p = Stream.repeatEffect(Clock.currentTimeMillis).pipe(
  Stream.schedule(Schedule.spaced("1 second")),
  Stream.flatMap((time) =>
    Effect.flatMap(Producer.Producer, (producer) =>
      producer.send({
        topic: "test-topic",
        messages: [{ value: "Hello, effect-kafka user!", timestamp: String(time) }],
      }),
    ),
  ),
);

const c = Consumer.serveStream("test-topic", { groupId: "group" }).pipe(
  Stream.tap(({ topic, partition, ...message }) =>
    Console.log({
      topic,
      partition,
      offset: message.offset,
      value: message.value?.toString(),
      time: message.timestamp,
    }),
  ),
);

const program = Stream.merge(p, c).pipe(Stream.runDrain);

const ProducerLive = Producer.layer({ allowAutoTopicCreation: true });
const KafkaLive = ConfluentKafkaJSInstance.layer({ brokers: ["localhost:19092"] });
const MainLive = Effect.scoped(program.pipe(Effect.provide(ProducerLive))).pipe(Effect.provide(KafkaLive));

NodeRuntime.runMain(MainLive);
