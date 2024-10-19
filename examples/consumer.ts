import { NodeRuntime } from "@effect/platform-node";
import { Console, Effect, Layer } from "effect";
import { Consumer, KafkaJSInstance, MessagePayload, MessageRouter } from "../src";

// const kafka = new Kafka({
//   brokers: ["localhost:19092"],
// });

// const producer = kafka.producer();
// const consumer = kafka.consumer({ groupId: "group" });

// class Producer extends Effect.Tag("Producer")<
//   Producer,
//   {
//     readonly send: (record: ProducerRecord) => Effect.Effect<RecordMetadata[]>;
//     readonly sendBatch: (batch: ProducerBatch) => Effect.Effect<RecordMetadata[]>;
//   }
// >() {}

// class Consumer extends Effect.Tag("Consumer")<
//   Consumer,
//   {
//     readonly subscribe: (
//       subscription: ConsumerSubscribeTopics,
//     ) => Effect.Effect<RecordMetadata[]>;
//   }
// >() {}

// const e = Effect.acquireRelease(
//   Effect.tryPromise(() => producer.connect()),
//   () => Effect.promise(() => producer.disconnect()),
// );

// Effect.gen(function* () {
//   yield* Producer.send({
//     topic: "test-topic",
//     messages: [{ value: "Hello KafkaJS user!" }],
//   });
// });

const ConsumerLive = MessageRouter.empty.pipe(
  MessageRouter.subscribe(
    "test-topic",
    Effect.flatMap(MessagePayload.MessagePayload, ({ topic: _, partition, message }) =>
      Console.log({
        partition,
        offset: message.offset,
        value: message.value?.toString(),
      }),
    ),
  ),
  Consumer.serve({ groupId: "group" }),
);

const KafkaLive = KafkaJSInstance.layer({ brokers: ["localhost:19092"] });
const MainLive = ConsumerLive.pipe(Layer.provide(KafkaLive));

NodeRuntime.runMain(Layer.launch(MainLive));

// const run = async () => {
//   // Producing
//   await producer.connect();
//   await producer.send({
//     topic: "test-topic",
//     messages: [{ value: "Hello KafkaJS user!" }],
//   });

//   // Consuming
//   await consumer.connect();
//   await consumer.subscribe({ topic: "test-topic", fromBeginning: true });

//   await consumer.run({
//     eachMessage: async ({ topic: _, partition, message }) => {
//       console.log({
//         partition,
//         offset: message.offset,
//         value: message.value?.toString(),
//       });
//     },
//   });
// };

// run().catch(console.error);
