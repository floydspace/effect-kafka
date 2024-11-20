/**
 * @since 0.2.0
 */
import { GlobalConfig } from "@confluentinc/kafka-javascript";
import { Array, Chunk, Config, Effect, Fiber, Layer, Queue, Runtime, Stream } from "effect";
import * as Consumer from "../Consumer";
import * as ConsumerRecord from "../ConsumerRecord";
import * as KafkaInstance from "../KafkaInstance";
import type * as MessageRouter from "../MessageRouter";
import * as Producer from "../Producer";
import * as internal from "./internal/confluentRdKafkaInstance";

/**
 * @since 0.4.1
 * @category constructors
 */
export const make = (config: GlobalConfig): Effect.Effect<KafkaInstance.KafkaInstance> =>
  Effect.gen(function* () {
    const logger = yield* internal.makeLogger;

    return KafkaInstance.make({
      producer: (options) =>
        Effect.gen(function* () {
          const producerConfig: internal.ProducerConfig = {
            ...config,
            retries: options?.retry?.retries ?? 5,
            debug: "all",
            logger,
          };
          if (options && "allowAutoTopicCreation" in options) {
            producerConfig["allow.auto.create.topics"] = options.allowAutoTopicCreation;
          }
          if (options && "idempotent" in options) {
            producerConfig["enable.idempotence"] = options.idempotent;
          }
          if (options && "queueBuffering" in options) {
            if (options.queueBuffering && "maxMessages" in options.queueBuffering) {
              producerConfig["queue.buffering.max.messages"] = options.queueBuffering.maxMessages;
            }
            if (options.queueBuffering && "maxKbytes" in options.queueBuffering) {
              producerConfig["queue.buffering.max.kbytes"] = options.queueBuffering.maxKbytes;
            }
            if (options.queueBuffering && "maxMs" in options.queueBuffering) {
              producerConfig["queue.buffering.max.ms"] = options.queueBuffering.maxMs;
            }
          }
          if (options && "batching" in options) {
            if (options.batching && "maxMessages" in options.batching) {
              producerConfig["batch.num.messages"] = options.batching.maxMessages;
            }
            if (options.batching && "maxBytes" in options.batching) {
              producerConfig["batch.size"] = options.batching.maxBytes;
            }
          }
          if (options && "stickyPartitioning" in options) {
            if (options.stickyPartitioning && "lingerMs" in options.stickyPartitioning) {
              producerConfig["sticky.partitioning.linger.ms"] = options.stickyPartitioning.lingerMs;
            }
          }
          if (options && "metadataMaxAge" in options) {
            producerConfig["topic.metadata.refresh.interval.ms"] = options.metadataMaxAge;
          }
          if (options && "transactionTimeout" in options) {
            producerConfig["transaction.timeout.ms"] = options.transactionTimeout;
          }
          if (options && "maxInFlightRequests" in options) {
            producerConfig["max.in.flight"] = options.maxInFlightRequests;
          }
          if (options && "transactionalId" in options) {
            producerConfig["transactional.id"] = options.transactionalId;
          }
          if (options && "compression" in options) {
            producerConfig["compression.codec"] = options.compression;
          }
          if (options && "partitioner" in options) {
            producerConfig.partitioner = options.partitioner;
          }
          if (options && "acks" in options) {
            producerConfig.acks = options.acks;
          }
          if (options && "timeout" in options) {
            producerConfig["request.timeout.ms"] = options.timeout;
          }

          const producer = yield* internal.connectProducerScoped(producerConfig);

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
          const consumerConfig: internal.ConsumerConfig = {
            ...config,
            "group.id": options.groupId,
            "allow.auto.create.topics": options.allowAutoTopicCreation ?? true,
            "session.timeout.ms": options.sessionTimeout ?? 30000,
            "fetch.wait.max.ms": options.maxWaitTimeInMs ?? 5000,
            "max.poll.interval.ms": options.rebalanceTimeout ?? 300000,
            "partition.assignment.strategy": options.partitionAssigners?.join(",") ?? "roundrobin",
            debug: "all",
            logger,
          };
          if (options && "autoCommit" in options) {
            consumerConfig["enable.auto.commit"] = options.autoCommit;
          }
          if (options && "autoCommitInterval" in options) {
            consumerConfig["auto.commit.interval.ms"] = options.autoCommitInterval;
          }
          if (options && "maxBytesPerPartition" in options) {
            consumerConfig["max.partition.fetch.bytes"] = options.maxBytesPerPartition;
          }
          if (options && "maxBytes" in options) {
            consumerConfig["fetch.max.bytes"] = options.maxBytes;
          }
          if (options && "minBytes" in options) {
            consumerConfig["fetch.min.bytes"] = options.minBytes;
          }
          if (options && "readUncommitted" in options) {
            consumerConfig["isolation.level"] = options.readUncommitted ? "read_uncommitted" : "read_committed";
          }
          if (options && "fromBeginning" in options) {
            consumerConfig["auto.offset.reset"] = options.fromBeginning ? "earliest" : "latest";
          }
          if (options && "heartbeatInterval" in options) {
            consumerConfig["heartbeat.interval.ms"] = options.heartbeatInterval;
          }
          if (options && "metadataMaxAge" in options) {
            consumerConfig["topic.metadata.refresh.interval.ms"] = options.metadataMaxAge;
          }

          const consumer = yield* internal.connectConsumerScoped(consumerConfig);

          const subscribeAndConsume = (topics: MessageRouter.Route.Path[]) =>
            Effect.gen(function* () {
              const runtime = yield* Effect.runtime();

              yield* internal.subscribeScoped(consumer, topics);

              const queue = yield* Queue.bounded<ConsumerRecord.ConsumerRecord>(1);

              const eachMessage: internal.ConsumerHandler = (payload) =>
                Queue.offer(
                  queue,
                  ConsumerRecord.make({
                    topic: payload.topic,
                    partition: payload.partition,
                    highWatermark: "-1001", // Not supported
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
                    heartbeat: () => Effect.void, // Not supported
                    commit: () => Effect.sync(() => consumer.commit()),
                  }),
                ).pipe(Runtime.runFork(runtime));

              yield* internal.consume(consumer, { eachMessage });

              return queue;
            });

          return Consumer.make({
            run: (app) =>
              Effect.gen(function* () {
                const topics = Chunk.toArray(app.routes).map((route) => route.topic);

                const queue = yield* subscribeAndConsume(topics);

                const fiber = yield* app.pipe(
                  Effect.provideServiceEffect(ConsumerRecord.ConsumerRecord, Queue.take(queue)),
                  Effect.forever,
                  Effect.fork,
                );

                yield* Fiber.join(fiber);
              }).pipe(Effect.scoped),
            runStream: (topic) =>
              subscribeAndConsume([topic]).pipe(Effect.map(Stream.fromQueue), Stream.scoped, Stream.flatten()),
          });
        }),
    });
  });

/**
 * @since 0.2.0
 * @category layers
 */
export const layer = (config: GlobalConfig) => Layer.effect(KafkaInstance.KafkaInstance, make(config));

/**
 * @since 0.4.1
 * @category layers
 */
export const layerConfig = (config: Config.Config.Wrap<GlobalConfig>) =>
  Layer.effect(KafkaInstance.KafkaInstance, Config.unwrap(config).pipe(Effect.flatMap(make)));
