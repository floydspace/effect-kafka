/**
 * @since 0.2.0
 */
import KafkaJS from "kafkajs";

/**
 * @since 0.6.0
 */
type KafkaJSError = KafkaJS.KafkaJSError;
const KafkaJSError = KafkaJS.KafkaJSError;

/**
 * @since 0.6.0
 */
type KafkaJSProtocolError = KafkaJS.KafkaJSProtocolError;
const KafkaJSProtocolError = KafkaJS.KafkaJSProtocolError;

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
  interface KafkaJSProtocolError {
    _tag: "KafkaJSProtocolError";
  }
  interface KafkaJSConnectionError {
    _tag: "KafkaJSConnectionError";
  }
  interface KafkaJSNonRetriableError {
    _tag: "KafkaJSNonRetriableError";
  }
}

KafkaJSProtocolError.prototype._tag = "KafkaJSProtocolError";
KafkaJSConnectionError.prototype._tag = "KafkaJSConnectionError";
KafkaJSNonRetriableError.prototype._tag = "KafkaJSNonRetriableError";

/**
 * @since 0.6.0
 */
export type KafkaJSErrors = KafkaJSProtocolError | KafkaJSConnectionError | KafkaJSNonRetriableError;

/**
 * @since 0.6.0
 */
export const isKafkaJSError = (error: unknown): error is KafkaJSError => error instanceof KafkaJSError;

export {
  /**
   * @since 0.2.0
   */
  KafkaJSConnectionError,
  /**
   * @since 0.6.0
   */
  KafkaJSError,
  /**
   * @since 0.2.0
   */
  KafkaJSNonRetriableError,
  /**
   * @since 0.6.0
   */
  KafkaJSProtocolError,
};
