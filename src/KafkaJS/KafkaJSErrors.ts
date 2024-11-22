/**
 * @since 0.2.0
 */
import KafkaJS from "kafkajs";

const KafkaJSConnectionError = KafkaJS.KafkaJSConnectionError;
type KafkaJSConnectionError = KafkaJS.KafkaJSConnectionError;
const KafkaJSNonRetriableError = KafkaJS.KafkaJSNonRetriableError;
type KafkaJSNonRetriableError = KafkaJS.KafkaJSNonRetriableError;

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

export {
  /**
   * @since 0.2.0
   */
  KafkaJSConnectionError,
  /**
   * @since 0.2.0
   */
  KafkaJSNonRetriableError,
};
