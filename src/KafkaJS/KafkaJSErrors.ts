/**
 * @since 0.2.0
 */
import KafkaJS from "kafkajs";

/**
 * @since 0.2.0
 */
type KafkaJSConnectionError = KafkaJS.KafkaJSConnectionError;
const KafkaJSConnectionError = KafkaJS.KafkaJSConnectionError;

/**
 * @since 0.2.0
 */
type KafkaJSNonRetriableError = KafkaJS.KafkaJSNonRetriableError;
const KafkaJSNonRetriableError = KafkaJS.KafkaJSNonRetriableError;

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
