/**
 * @since 0.2.0
 */
import { KafkaJS } from "@confluentinc/kafka-javascript";
import { Config, Effect, Layer, Queue, Runtime } from "effect";
import * as Admin from "../Admin.js";
import * as Consumer from "../Consumer.js";
import * as ConsumerRecord from "../ConsumerRecord.js";
import * as KafkaInstance from "../KafkaInstance.js";
import * as Producer from "../Producer.js";
import * as internal from "./internal/confluentKafkaJSInstance.js";

const mapBatchToConsumerRecords = (payload: KafkaJS.EachBatchPayload): ConsumerRecord.ConsumerRecord[] =>
  payload.batch.messages.map((message) =>
    ConsumerRecord.make({
      topic: payload.batch.topic,
      partition: payload.batch.partition,
      highWatermark: payload.batch.highWatermark,
      key: message.key,
      value: message.value,
      timestamp: message.timestamp,
      attributes: message.attributes,
      offset: message.offset,
      headers: message.headers,
      size: message.size,
      heartbeat: () => Effect.promise(() => payload.heartbeat()),
      commit: () => Effect.promise(() => payload.commitOffsetsIfNecessary()),
    }),
  );

/**
 * @since 0.2.0
 * @category constructors
 */
export const make = (config: KafkaJS.KafkaConfig): Effect.Effect<KafkaInstance.KafkaInstance> =>
  Effect.gen(function* () {
    const logger = yield* internal.makeLogger;
    const kafka = new KafkaJS.Kafka({ kafkaJS: { ...config, logger, logLevel: KafkaJS.logLevel.DEBUG } });

    return KafkaInstance.make({
      admin: (options) =>
        Effect.gen(function* () {
          const admin = yield* internal.connectAdminScoped(kafka, options as KafkaJS.AdminConfig);

          return Admin.make({
            listTopics: () => internal.listTopics(admin),
          });
        }),
      producer: (options) =>
        Effect.gen(function* () {
          const producer = yield* internal.connectProducerScoped(kafka, options as KafkaJS.ProducerConfig);

          return Producer.make({
            send: (record) => internal.send(producer, record),
            sendBatch: (batch) => internal.sendBatch(producer, batch),
          });
        }),
      consumer: (options) =>
        Effect.gen(function* () {
          const consumer = yield* internal.connectConsumerScoped(kafka, options as KafkaJS.ConsumerConfig);

          return Consumer.make({
            subscribe: (topics) => internal.subscribe(consumer, { topics }),
            consume: () =>
              Effect.gen(function* () {
                const queue = yield* Queue.bounded<ConsumerRecord.ConsumerRecord>(1);

                const runtime = yield* Effect.runtime();

                const eachBatch: KafkaJS.EachBatchHandler = async (payload) => {
                  await Queue.offerAll(queue, mapBatchToConsumerRecords(payload)).pipe(Runtime.runPromise(runtime));
                };

                yield* internal.consume(consumer, { eachBatch });

                return queue;
              }),
          });
        }),
    });
  });

/**
 * @since 0.2.0
 * @category layers
 */
export const layer = (config: KafkaJS.KafkaConfig) => Layer.effect(KafkaInstance.KafkaInstance, make(config));

/**
 * @since 0.4.1
 * @category layers
 */
export const layerConfig = (config: Config.Config.Wrap<KafkaJS.KafkaConfig>) =>
  Layer.effect(KafkaInstance.KafkaInstance, Config.unwrap(config).pipe(Effect.flatMap(make)));
