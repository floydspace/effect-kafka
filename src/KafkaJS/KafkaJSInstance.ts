/**
 * @since 0.2.0
 */
import { Config, Effect, Layer, Queue, Runtime } from "effect";
import { EachBatchHandler, EachBatchPayload, Kafka, KafkaConfig, logLevel } from "kafkajs";
import * as Consumer from "../Consumer.js";
import * as ConsumerRecord from "../ConsumerRecord.js";
import * as KafkaInstance from "../KafkaInstance.js";
import * as Producer from "../Producer.js";
import * as internal from "./internal/kafkaJSInstance.js";

const mapBatchToConsumerRecords = (payload: EachBatchPayload): ConsumerRecord.ConsumerRecord[] =>
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
export const make = (config: KafkaConfig): Effect.Effect<KafkaInstance.KafkaInstance> =>
  Effect.gen(function* () {
    const logger = yield* internal.makeLogger;
    const kafka = new Kafka({ ...config, logCreator: () => logger, logLevel: logLevel.DEBUG });

    return KafkaInstance.make({
      producer: (options) =>
        Effect.gen(function* () {
          const producer = yield* internal.connectProducerScoped(kafka, options);

          return Producer.make({
            send: (record) => internal.send(producer, record),
            sendBatch: (batch) => internal.sendBatch(producer, batch),
          });
        }),
      consumer: ({ autoCommit, partitionAssigners: _, fromBeginning, ...options }) =>
        Effect.gen(function* () {
          const consumer = yield* internal.connectConsumerScoped(kafka, options);

          return Consumer.make({
            subscribe: (topics) => internal.subscribe(consumer, { topics, fromBeginning }),
            consume: () =>
              Effect.gen(function* () {
                const queue = yield* Queue.bounded<ConsumerRecord.ConsumerRecord>(1);

                const runtime = yield* Effect.runtime();

                const eachBatch: EachBatchHandler = async (payload) => {
                  await Queue.offerAll(queue, mapBatchToConsumerRecords(payload)).pipe(Runtime.runPromise(runtime));
                };

                yield* internal.consume(consumer, { eachBatch, autoCommit });

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
export const layer = (config: KafkaConfig) => Layer.effect(KafkaInstance.KafkaInstance, make(config));

/**
 * @since 0.4.1
 * @category layers
 */
export const layerConfig = (config: Config.Config.Wrap<KafkaConfig>) =>
  Layer.effect(KafkaInstance.KafkaInstance, Config.unwrap(config).pipe(Effect.flatMap(make)));
