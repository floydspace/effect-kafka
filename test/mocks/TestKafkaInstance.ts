import { Effect, Layer } from "effect";
import type * as KafkaJS from "kafkajs";
import * as internal from "../../src/internal/kafkaJSInstance";
import * as KafkaInstance from "../../src/KafkaInstance";
import * as Producer from "../../src/Producer";

export const testKafkaInstanceLayer = (kafka: KafkaJS.Kafka) =>
  Layer.succeed(
    KafkaInstance.KafkaInstance,
    KafkaInstance.make({
      producer: (options) =>
        Effect.gen(function* () {
          const producer = yield* internal.connectProducerScoped(kafka, options);

          return Producer.make({
            send: (record) => internal.send(producer, record),
            sendBatch: (batch) => internal.sendBatch(producer, batch),
          });
        }),
      consumer: () => Effect.dieMessage("Not implemented"),
    }),
  );
