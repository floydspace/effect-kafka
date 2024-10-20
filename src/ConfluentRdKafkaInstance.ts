/**
 * @since 0.2.0
 */
import assert from "node:assert";

import {
  Client,
  CODES,
  ConsumerGlobalConfig,
  GlobalConfig,
  KafkaConsumer,
  Producer as KafkaProducer,
  Message,
  ProducerGlobalConfig,
} from "@confluentinc/kafka-javascript";
import { Chunk, Effect, Layer, Runtime } from "effect";
import * as Consumer from "./Consumer";
import * as Error from "./ConsumerError";
import * as internal from "./internal/confluentRdKafkaInstance";
import * as KafkaInstance from "./KafkaInstance";
import * as MessagePayload from "./MessagePayload";
import * as Producer from "./Producer";

type ConsumerHandler = Parameters<Client<"data">["on"]>["1"];

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

          const producer = yield* Effect.acquireRelease(
            Effect.sync(() => new KafkaProducer(producerConfig)).pipe(
              Effect.tap((p) => internal.connect(p)),
              Effect.catchTag("LibrdKafkaError", (err) =>
                err.code === CODES.ERRORS.ERR__TRANSPORT
                  ? new Error.ConnectionException({ broker: err.origin, message: err.message, stack: err.stack })
                  : Effect.die(err),
              ),
            ),
            (c) => internal.disconnect(c).pipe(Effect.orDie),
          );

          return Producer.make({
            send: (record) => {
              assert(record.messages.length === 1, "RdKafka only supports single message sends");
              const [message] = record.messages;
              const messageValue = typeof message.value === "string" ? Buffer.from(message.value) : message.value;
              const timestamp = message.timestamp ? new Date(message.timestamp).getTime() : null;
              return Effect.sync(() => producer.produce(record.topic, null, messageValue, message.key, timestamp));
            },
            sendBatch: () => Effect.dieMessage("RdKafka does not support batch sends"),
          });
        }),
      consumer: (options) =>
        Effect.gen(function* () {
          const consumerConfig: ConsumerGlobalConfig = {
            ...config,
            "group.id": options.groupId,
            // TODO: map other options
          };

          const consumer = yield* Effect.acquireRelease(
            Effect.sync(() => new KafkaConsumer(consumerConfig)).pipe(
              Effect.tap((c) => internal.connect(c)),
              Effect.catchTag("LibrdKafkaError", (err) =>
                err.code === CODES.ERRORS.ERR__TRANSPORT
                  ? new Error.ConnectionException({ broker: err.origin, message: err.message, stack: err.stack })
                  : Effect.die(err),
              ),
            ),
            (c) => internal.disconnect(c).pipe(Effect.orDie),
          );

          return Consumer.make({
            run: (app) =>
              Effect.gen(function* () {
                const topics = Chunk.toArray(app.routes).map((route) => route.topic);
                yield* Effect.sync(() => consumer.subscribe(topics));

                const eachMessage: ConsumerHandler = yield* Effect.map(Effect.runtime<never>(), (runtime) => {
                  const runPromise = Runtime.runPromise(runtime);
                  return (payload: Message) =>
                    app.pipe(
                      Effect.provideService(
                        MessagePayload.MessagePayload,
                        MessagePayload.make({
                          topic: payload.topic,
                          message: {
                            key: typeof payload.key === "string" ? Buffer.from(payload.key) : (payload.key ?? null),
                            value: payload.value,
                            // headers: payload.headers?.reduce((acc, header) => {
                            //   const [key] = Object.keys(header);
                            //   acc[key] = header[key];
                            //   return acc;
                            // }, {}),
                            timestamp: payload.timestamp?.toString() ?? "",
                            offset: payload.offset.toString(),
                            attributes: 0,
                            size: payload.size,
                          },
                          partition: payload.partition,
                        }),
                      ),
                      runPromise,
                    );
                });

                consumer.on("data", eachMessage);

                yield* Effect.fork(Effect.sync(() => consumer.consume()));
                yield* Effect.never;
              }),
          });
        }),
    }),
  );
