import type { Client, ClientMetrics, Metadata, MetadataOptions } from "@confluentinc/kafka-javascript";
import { Effect } from "effect";
import { LibrdKafkaError } from "../ConfluentRdKafkaErrors";

// type ReadyEventListener = (info: ReadyInfo, metadata: Metadata) => void;
// type FailureEventListener = (error: LibrdKafkaError, metrics: ClientMetrics) => void;
// type ClientEventListener<Events extends string> = Parameters<Client<Events>["on"]>["1"];

// /** @internal */
// export const connect = <Events extends "ready" | "connection.failure">(
//   client: Client<Events>,
//   metadataOptions?: MetadataOptions,
// ): Effect.Effect<Metadata, LibrdKafkaError> =>
//   Effect.async<Metadata, LibrdKafkaError>((resume) => {
//     debugger;
//     client.connect(metadataOptions);

//     const readyListener: ReadyEventListener = (_, data) => resume(Effect.succeed(data));
//     client.on("ready" as Events, readyListener as ClientEventListener<Events>);

//     const failureListener: FailureEventListener = (err) => resume(new LibrdKafkaError(err));
//     client.on("connection.failure" as Events, failureListener as ClientEventListener<Events>);
//   });

/** @internal */
export const connect = <Events extends string>(
  client: Client<Events>,
  metadataOptions?: MetadataOptions,
): Effect.Effect<Metadata, LibrdKafkaError> =>
  Effect.async<Metadata, LibrdKafkaError>((resume) => {
    client.connect(metadataOptions, (err, data) =>
      err ? resume(new LibrdKafkaError(err)) : resume(Effect.succeed(data)),
    );
  });

/** @internal */
export const disconnect = <Events extends string>(client: Client<Events>) =>
  Effect.async<ClientMetrics, LibrdKafkaError>((resume) => {
    client.disconnect((err, data) => (err ? resume(new LibrdKafkaError(err)) : resume(Effect.succeed(data))));
  });
