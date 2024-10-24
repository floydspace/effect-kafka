/**
 * @since 0.2.0
 */
import { GlobalConfig, ProducerGlobalConfig } from "@confluentinc/kafka-javascript";
import { Array, Chunk, Effect, Layer, Queue } from "effect";
import * as Consumer from "./Consumer";
import * as ConsumerRecord from "./ConsumerRecord";
import * as internal from "./internal/confluentRdKafkaInstance";
import * as KafkaInstance from "./KafkaInstance";
import * as Producer from "./Producer";

/**
 * @since 0.2.0
 * @category layers
 */
export const layer = (config: GlobalConfig) =>
  Layer.succeed(
    KafkaInstance.KafkaInstance,
    KafkaInstance.make({
      producer: (options) =>
        Effect.gen(function* () {
          const producerConfig: ProducerGlobalConfig = { ...config };
          if (options && "allowAutoTopicCreation" in options) {
            producerConfig["allow.auto.create.topics"] = options.allowAutoTopicCreation;
          }
          if (options && "idempotent" in options) {
            producerConfig["enable.idempotence"] = options.idempotent;
          }
          // TODO: map other options

          const producer = yield* internal.acquireProducer(producerConfig);

          const send: Producer.Producer["send"] = (record) =>
            Effect.forEach(record.messages, (message) => {
              const messageValue = typeof message.value === "string" ? Buffer.from(message.value) : message.value;
              const timestamp = message.timestamp ? Number(message.timestamp) : null;
              return Effect.sync(() =>
                producer.produce(record.topic, message.partition, messageValue, message.key, timestamp),
              );
            });

          const sendBatch: Producer.Producer["sendBatch"] = (batch) =>
            Effect.forEach(batch.topicMessages!, send).pipe(Effect.map(Array.flatten));

          return Producer.make({ send, sendBatch });
        }),
      consumer: (options) =>
        Effect.gen(function* () {
          const consumer = yield* internal.acquireConsumer({
            ...config,
            "group.id": options.groupId,
            // TODO: map other options
          });

          return Consumer.make({
            run: (app) =>
              Effect.gen(function* () {
                const topics = Chunk.toArray(app.routes).map((route) => route.topic);

                const queue = yield* Queue.bounded<ConsumerRecord.ConsumerRecord>(1);

                consumer.on("data", (payload) =>
                  Queue.unsafeOffer(
                    queue,
                    ConsumerRecord.make({
                      topic: payload.topic,
                      partition: payload.partition,
                      key: typeof payload.key === "string" ? Buffer.from(payload.key) : (payload.key ?? null),
                      value: payload.value,
                      headers: payload.headers?.reduce((acc, header) => {
                        const [key] = Object.keys(header);
                        acc[key] = header[key];
                        return acc;
                      }, {}),
                      timestamp: payload.timestamp?.toString() ?? "",
                      offset: payload.offset.toString(),
                      attributes: 0,
                      size: payload.size,
                    }),
                  ),
                );

                yield* app.pipe(
                  Effect.provideServiceEffect(ConsumerRecord.ConsumerRecord, Queue.take(queue)),
                  Effect.forever,
                  Effect.fork,
                );

                yield* internal.consumeFromTopics(consumer, topics);
              }),
          });
        }),
    }),
  );
