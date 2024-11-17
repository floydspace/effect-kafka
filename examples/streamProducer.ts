import { NodeRuntime } from "@effect/platform-node";
import { Clock, Console, Effect, Layer, Schedule, Stream } from "effect";
import { Consumer, InMemoryKafkaInstance, Producer } from "../src";

const p = Stream.repeatEffect(Clock.currentTimeMillis).pipe(
  Stream.schedule(Schedule.spaced("1 second")),
  Stream.flatMap((time) =>
    Producer.send({
      topic: "test-topic",
      messages: [{ value: "Hello, effect-kafka user!", timestamp: String(time) }],
    }),
  ),
);

const c = Consumer.serveStream("test-topic").pipe(
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
const ConsumerLive = Consumer.layer({ groupId: "group" });

const KafkaLive = InMemoryKafkaInstance.layer();
const MainLive = program.pipe(Effect.provide(Layer.merge(ProducerLive, ConsumerLive)), Effect.provide(KafkaLive));

NodeRuntime.runMain(MainLive);
