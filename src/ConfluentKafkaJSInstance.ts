/**
 * @since 0.2.0
 */
import { KafkaJS } from "@confluentinc/kafka-javascript";
import { Chunk, Effect, Fiber, Layer, Queue } from "effect";
import * as Consumer from "./Consumer";
import * as ConsumerRecord from "./ConsumerRecord";
import * as internal from "./internal/confluentKafkaJSInstance";
import * as KafkaInstance from "./KafkaInstance";
import * as Producer from "./Producer";

/**
 * @since 0.2.0
 * @category constructors
 */
export const make = (config: KafkaJS.KafkaConfig): Effect.Effect<KafkaInstance.KafkaInstance> =>
  Effect.gen(function* () {
    const logger = yield* internal.makeLogger;
    const kafka = new KafkaJS.Kafka({ kafkaJS: { ...config, logger, logLevel: KafkaJS.logLevel.DEBUG } });

    return KafkaInstance.make({
      producer: (options) =>
        Effect.gen(function* () {
          const producer = yield* internal.connectProducerScoped(kafka, options);

          return Producer.make({
            send: (record) => Effect.promise(() => producer.send(record)),
            sendBatch: (batch) => Effect.promise(() => producer.sendBatch(batch)),
          });
        }),
      consumer: (options) =>
        Effect.gen(function* () {
          const consumer = yield* internal.connectConsumerScoped(kafka, { groupId: options.groupId });

          return Consumer.make({
            run: (app) =>
              Effect.gen(function* () {
                const topics = Chunk.toArray(app.routes).map((route) => route.topic);
                yield* internal.subscribe(consumer, { topics });

                const queue = yield* Queue.bounded<ConsumerRecord.ConsumerRecord>(1);

                const eachBatch: KafkaJS.EachBatchHandler = async (payload) => {
                  payload.batch.messages.forEach((message) => {
                    Queue.unsafeOffer(
                      queue,
                      ConsumerRecord.make({
                        topic: payload.batch.topic,
                        partition: payload.batch.partition,
                        key: message.key,
                        value: message.value,
                        timestamp: message.timestamp,
                        attributes: message.attributes,
                        offset: message.offset,
                        headers: message.headers,
                        size: message.size,
                      }),
                    );
                  });
                };

                const fiber = yield* app.pipe(
                  Effect.provideServiceEffect(ConsumerRecord.ConsumerRecord, Queue.take(queue)),
                  Effect.forever,
                  Effect.fork,
                );

                yield* internal.consume(consumer, { eachBatch });

                yield* Fiber.join(fiber);
              }),
          });
        }),
    });
  });

/**
 * @since 0.2.0
 * @category layers
 */
export const layer = (config: KafkaJS.KafkaConfig) => Layer.scoped(KafkaInstance.KafkaInstance, make(config));
