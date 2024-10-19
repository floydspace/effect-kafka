/**
 * @since 0.2.0
 */
import {
  Client,
  ClientMetrics,
  GlobalConfig,
  KafkaConsumer,
  LibrdKafkaError as LibrdKafkaError$,
  Message,
  Metadata,
} from "@confluentinc/kafka-javascript";
import { Chunk, Data, Effect, Layer, Runtime } from "effect";
import * as Consumer from "./Consumer";
import * as KafkaInstance from "./KafkaInstance";
import * as MessagePayload from "./MessagePayload";

/**
 * @since 0.2.0
 * @category errors
 */
export class LibrdKafkaError extends Data.TaggedError("LibrdKafkaError")<LibrdKafkaError$> {}

const connect = (c: KafkaConsumer) =>
  Effect.async<Metadata, LibrdKafkaError>((resume) => {
    c.connect({}, (err, data) => (err ? resume(new LibrdKafkaError(err)) : resume(Effect.succeed(data))));
  });

const disconnect = (c: KafkaConsumer) =>
  Effect.async<ClientMetrics, LibrdKafkaError>((resume) => {
    c.disconnect((err, data) => (err ? resume(new LibrdKafkaError(err)) : resume(Effect.succeed(data))));
  });

type ConsumerHandler = Parameters<Client<"data">["on"]>["1"];

/**
 * @since 0.2.0
 * @category layers
 */
export const layer = (config: GlobalConfig) =>
  Layer.succeed(
    KafkaInstance.KafkaInstance,
    KafkaInstance.make({
      producer: () => Effect.never,
      consumer: (options) =>
        Effect.gen(function* () {
          const consumer = yield* Effect.acquireRelease(
            Effect.sync(
              () =>
                new KafkaConsumer({
                  ...config,
                  "group.id": options.groupId,
                }),
            ).pipe(Effect.tap(connect), Effect.orDie),
            (c) => disconnect(c).pipe(Effect.orDie),
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
