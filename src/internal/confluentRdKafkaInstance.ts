import type { ClientMetrics, KafkaConsumer, Metadata, MetadataOptions } from "@confluentinc/kafka-javascript";
import { Effect } from "effect";
import { dual } from "effect/Function";
import { LibrdKafkaError } from "../ConfluentRdKafkaErrors";

/** @internal */
export const connect = dual<
  { (metadataOptions?: MetadataOptions): (consumer: KafkaConsumer) => Effect.Effect<Metadata, LibrdKafkaError> },
  { (consumer: KafkaConsumer, metadataOptions?: MetadataOptions): Effect.Effect<Metadata, LibrdKafkaError> }
>(
  2,
  (consumer: KafkaConsumer, metadataOptions?: MetadataOptions): Effect.Effect<Metadata, LibrdKafkaError> =>
    Effect.async<Metadata, LibrdKafkaError>((resume) => {
      consumer.connect(metadataOptions, (err, data) =>
        err ? resume(new LibrdKafkaError(err)) : resume(Effect.succeed(data)),
      );
    }),
);

/** @internal */
export const disconnect = (consumer: KafkaConsumer) =>
  Effect.async<ClientMetrics, LibrdKafkaError>((resume) => {
    consumer.disconnect((err, data) => (err ? resume(new LibrdKafkaError(err)) : resume(Effect.succeed(data))));
  });
