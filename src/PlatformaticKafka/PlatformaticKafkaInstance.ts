/**
 * @since 0.8.0
 */
import {
  BaseOptions,
  ConsumerOptions,
  Message,
  MessageToProduce,
  ProducerOptions,
  StreamOptions,
  stringSerializers,
} from "@platformatic/kafka";
import { Array, Config, Deferred, Effect, Layer, Queue } from "effect";
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
    key: message.key.length > 0 ? message.key : null,
    value: message.value.length > 0 ? message.value : null,
    timestamp: message.timestamp.toString(),
    offset: message.offset.toString(),
    headers: [...message.headers.entries()].reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key.toString()]: value,
      }),
      {} as ConsumerRecord.ConsumerRecord.Headers,
    ),
    attributes: 0,
    highWatermark: "",
    heartbeat: () => Effect.dieMessage("Not supported"),
    commit: () => Effect.promise(() => message.commit() as Promise<void>),
  });

/**
 * @since 0.8.0
 * @category constructors
 */
export const make = (config: BaseOptions): KafkaInstance.KafkaInstance =>
  KafkaInstance.make({
    admin: () =>
      Effect.gen(function* () {
        const admin = yield* internal.connectAdminScoped(config);

        return Admin.make({
          listTopics: () => internal.listTopics(admin),
        });
      }),
    producer: (options) =>
      Effect.gen(function* () {
        const produceOptions: ProducerOptions<string, string, string, string> = {
          ...config,
          acks: options?.acks,
          autocreateTopics: options?.allowAutoTopicCreation,
          compression: options?.compression,
          idempotent: options?.idempotent,
          serializers: stringSerializers,
        };
        const producer = yield* internal.connectProducerScoped(produceOptions);

        const send: Producer.Producer["send"] = (record) =>
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
                  }) as MessageToProduce<string, string, string, string>,
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
                    }) satisfies Producer.Producer.RecordMetadata,
                ),
              ),
            );

        return Producer.make({
          send,
          sendBatch: (batch) => Effect.forEach(batch.topicMessages ?? [], send).pipe(Effect.map(Array.flatten)),
        });
      }),
    consumer: ({ partitionAssigners: _, fromBeginning: __, ...options }) =>
      Effect.gen(function* () {
        const consumeOptions: ConsumerOptions<Buffer, Buffer, Buffer, Buffer> = {
          ...config,
          groupId: options.groupId,
          autocommit: options.autoCommit ?? true,
          isolationLevel: options.readUncommitted ? "READ_UNCOMMITTED" : "READ_COMMITTED",
        };
        if (options && "heartbeatInterval" in options) {
          consumeOptions.heartbeatInterval = options.heartbeatInterval;
        }
        if (options && "maxBytes" in options) {
          consumeOptions.maxBytes = options.maxBytes;
        }
        if (options && "minBytes" in options) {
          consumeOptions.minBytes = options.minBytes;
        }
        if (options && "rebalanceTimeout" in options) {
          consumeOptions.rebalanceTimeout = options.rebalanceTimeout;
        }
        if (options && "sessionTimeout" in options) {
          consumeOptions.sessionTimeout = options.sessionTimeout;
        }
        if (options && "maxWaitTimeInMs" in options) {
          consumeOptions.maxWaitTime = options.maxWaitTimeInMs;
        }
        const consumer = yield* internal.connectConsumerScoped(consumeOptions);

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

/**
 * @since 0.8.0
 * @category layers
 */
export const layer = (config: BaseOptions) => Layer.succeed(KafkaInstance.KafkaInstance, make(config));

/**
 * @since 0.4.1
 * @category layers
 */
export const layerConfig = (config: Config.Config.Wrap<BaseOptions>) =>
  Layer.effect(KafkaInstance.KafkaInstance, Config.unwrap(config).pipe(Effect.map(make)));
