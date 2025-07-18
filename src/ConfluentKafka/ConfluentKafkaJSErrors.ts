/**
 * @since 0.6.0
 */
import { KafkaJS } from "@confluentinc/kafka-javascript";

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
 * @since 0.6.0
 */
type KafkaJSOffsetOutOfRange = KafkaJS.KafkaJSOffsetOutOfRange;
const KafkaJSOffsetOutOfRange = KafkaJS.KafkaJSOffsetOutOfRange;

/**
 * @since 0.6.0
 */
type KafkaJSConnectionError = KafkaJS.KafkaJSConnectionError;
const KafkaJSConnectionError = KafkaJS.KafkaJSConnectionError;

/**
 * @since 0.6.0
 */
type KafkaJSRequestTimeoutError = KafkaJS.KafkaJSRequestTimeoutError;
const KafkaJSRequestTimeoutError = KafkaJS.KafkaJSRequestTimeoutError;

/**
 * @since 0.6.0
 */
type KafkaJSPartialMessageError = KafkaJS.KafkaJSPartialMessageError;
const KafkaJSPartialMessageError = KafkaJS.KafkaJSPartialMessageError;

/**
 * @since 0.6.0
 */
type KafkaJSSASLAuthenticationError = KafkaJS.KafkaJSSASLAuthenticationError;
const KafkaJSSASLAuthenticationError = KafkaJS.KafkaJSSASLAuthenticationError;

/**
 * @since 0.6.0
 */
type KafkaJSNotImplemented = KafkaJS.KafkaJSNotImplemented;
const KafkaJSNotImplemented = KafkaJS.KafkaJSNotImplemented;

/**
 * @since 0.6.0
 */
type KafkaJSTimeout = KafkaJS.KafkaJSTimeout;
const KafkaJSTimeout = KafkaJS.KafkaJSTimeout;

/**
 * @since 0.6.0
 */
export type KafkaJSErrors =
  | KafkaJSError
  | KafkaJSProtocolError
  | KafkaJSOffsetOutOfRange
  | KafkaJSConnectionError
  | KafkaJSRequestTimeoutError
  | KafkaJSPartialMessageError
  | KafkaJSSASLAuthenticationError
  | KafkaJSNotImplemented
  | KafkaJSTimeout;

/**
 * @since 0.6.0
 */
export const isKafkaJSError = (error: unknown): error is KafkaJSErrors =>
  error instanceof KafkaJSError ||
  error instanceof KafkaJSProtocolError ||
  error instanceof KafkaJSOffsetOutOfRange ||
  error instanceof KafkaJSConnectionError ||
  error instanceof KafkaJSRequestTimeoutError ||
  error instanceof KafkaJSPartialMessageError ||
  error instanceof KafkaJSSASLAuthenticationError ||
  error instanceof KafkaJSNotImplemented ||
  error instanceof KafkaJSTimeout;

export {
  /**
   * @since 0.6.0
   */
  KafkaJSConnectionError,
  /**
   * @since 0.6.0
   */
  KafkaJSError,
  /**
   * @since 0.6.0
   */
  KafkaJSNotImplemented,
  /**
   * @since 0.6.0
   */
  KafkaJSOffsetOutOfRange,
  /**
   * @since 0.6.0
   */
  KafkaJSPartialMessageError,
  /**
   * @since 0.6.0
   */
  KafkaJSProtocolError,
  /**
   * @since 0.6.0
   */
  KafkaJSRequestTimeoutError,
  /**
   * @since 0.6.0
   */
  KafkaJSSASLAuthenticationError,
  /**
   * @since 0.6.0
   */
  KafkaJSTimeout,
};
