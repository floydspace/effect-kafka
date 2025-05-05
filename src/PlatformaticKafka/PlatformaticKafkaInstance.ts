/**
 * @since 0.8.0
 */
import {
  BaseOptions,
  ConsumeBaseOptions,
  GroupOptions,
  Message,
  MessageToProduce,
  ProduceOptions,
  StreamOptions,
} from "@platformatic/kafka";
import { Config, Deferred, Effect, Layer, Queue } from "effect";
import * as Admin from "../Admin.js";
import * as Consumer from "../Consumer.js";
import * as ConsumerRecord from "../ConsumerRecord.js";
import * as KafkaInstance from "../KafkaInstance.js";
import * as Producer from "../Producer.js";
import * as internal from "./internal/platformaticKafkaInstance.js";

const mapBatchToConsumerRecords = (message: Message<Buffer, Buffer, Buffer, Buffer>): ConsumerRecord.ConsumerRecord =>
  ConsumerRecord.make({
    topic: message.topic,
    partition: message.partition,
    key: message.key,
    value: message.value,
    timestamp: message.timestamp.toString(),
    offset: message.offset.toString(),
    // headers: message.headers,
    attributes: 0,
    highWatermark: "",
    heartbeat: () => Effect.dieMessage("Not supported"),
    commit: () => Effect.promise(() => message.commit() as Promise<void>),
  });

/**
 * @since 0.8.0
 * @category constructors
 */
export const make = (config: BaseOptions): Effect.Effect<KafkaInstance.KafkaInstance> =>
  Effect.gen(function* () {
    // const logger = yield* internal.makeLogger;

    return KafkaInstance.make({
      admin: () =>
        Effect.gen(function* () {
          const admin = yield* internal.connectAdminScoped(config);

          return Admin.make({
            listTopics: () => internal.listTopics(admin),
          });
        }),
      producer: (options) =>
        Effect.gen(function* () {
          const produceOptions: ProduceOptions<Buffer, Buffer, Buffer, Buffer> = {
            acks: options?.acks,
            autocreateTopics: options?.allowAutoTopicCreation,
            compression: options?.compression,
            idempotent: options?.idempotent,
          };
          const producer = yield* internal.connectProducerScoped({ ...config, ...produceOptions });

          return Producer.make({
            send: (record) =>
              internal
                .send(producer, {
                  messages: record.messages.map(
                    (message) =>
                      ({
                        topic: record.topic,
                        key: message.key,
                        value: message.value,
                        partition: message.partition,
                        timestamp: message.timestamp,
                        headers: message.headers,
                      }) as MessageToProduce<Buffer, Buffer, Buffer, Buffer>,
                  ),
                })
                .pipe(
                  Effect.map((result) =>
                    (result.offsets ?? []).map(
                      (offset) =>
                        ({
                          topicName: offset.topic,
                          partition: offset.partition,
                          offset: offset.offset.toString(),
                          errorCode: 0,
                        }) as Producer.Producer.RecordMetadata,
                    ),
                  ),
                ),
            sendBatch: (batch) =>
              internal
                .send(producer, {
                  messages: (batch.topicMessages ?? [])
                    .map((topicMessage) =>
                      topicMessage.messages.map(
                        (message) =>
                          ({
                            topic: topicMessage.topic,
                            key: message.key,
                            value: message.value,
                            partition: message.partition,
                            timestamp: message.timestamp,
                            headers: message.headers,
                          }) as MessageToProduce<Buffer, Buffer, Buffer, Buffer>,
                      ),
                    )
                    .flat(),
                })
                .pipe(
                  Effect.map((result) =>
                    (result.offsets ?? []).map(
                      (offset) =>
                        ({
                          topicName: offset.topic,
                          partition: offset.partition,
                          offset: offset.offset.toString(),
                          errorCode: 0,
                        }) as Producer.Producer.RecordMetadata,
                    ),
                  ),
                ),
          });
        }),
      consumer: ({ partitionAssigners: _, fromBeginning, ...options }) =>
        Effect.gen(function* () {
          const consumeOptions: { groupId: string } & GroupOptions &
            ConsumeBaseOptions<Buffer, Buffer, Buffer, Buffer> = {
            groupId: options.groupId,
            autocommit: options.autoCommit,
            heartbeatInterval: options.heartbeatInterval,
            maxBytes: options.maxBytes,
            minBytes: options.minBytes,
            rebalanceTimeout: options.rebalanceTimeout,
            sessionTimeout: options.sessionTimeout,
            maxWaitTime: options.maxWaitTimeInMs,
            isolationLevel: options.readUncommitted ? "READ_UNCOMMITTED" : "READ_COMMITTED",
          };
          const consumer = yield* internal.connectConsumerScoped({ ...config, ...consumeOptions });

          const streamOptions = yield* Deferred.make<StreamOptions>();

          return Consumer.make({
            subscribe: (topics) => Deferred.succeed(streamOptions, { topics: topics as string[] }),
            consume: () =>
              Effect.gen(function* () {
                const queue = yield* Queue.bounded<ConsumerRecord.ConsumerRecord>(1);

                const stream = yield* internal.consume(consumer, yield* Deferred.await(streamOptions));

                stream.on("data", (message) => {
                  Queue.unsafeOffer(queue, mapBatchToConsumerRecords(message));
                });

                return queue;
              }),
          });
        }),
    });
  });

/**
 * @since 0.8.0
 * @category layers
 */
export const layer = (config: BaseOptions) => Layer.effect(KafkaInstance.KafkaInstance, make(config));

/**
 * @since 0.4.1
 * @category layers
 */
export const layerConfig = (config: Config.Config.Wrap<BaseOptions>) =>
  Layer.effect(KafkaInstance.KafkaInstance, Config.unwrap(config).pipe(Effect.flatMap(make)));
