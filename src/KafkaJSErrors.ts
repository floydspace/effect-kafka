import { KafkaJSConnectionError, KafkaJSNonRetriableError } from "kafkajs";

declare module "kafkajs" {
  interface KafkaJSConnectionError {
    _tag: "KafkaJSConnectionError";
  }
  interface KafkaJSNonRetriableError {
    _tag: "KafkaJSNonRetriableError";
  }
}

KafkaJSConnectionError.prototype._tag = "KafkaJSConnectionError";
KafkaJSNonRetriableError.prototype._tag = "KafkaJSNonRetriableError";

export { KafkaJSConnectionError, KafkaJSNonRetriableError };
