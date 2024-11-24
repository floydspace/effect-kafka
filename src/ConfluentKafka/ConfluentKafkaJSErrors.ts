/**
 * @since 0.6.0
 */
/* eslint-disable @typescript-eslint/no-shadow */
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
type KafkaJSNoBrokerAvailableError = KafkaJS.KafkaJSNoBrokerAvailableError;
const KafkaJSNoBrokerAvailableError = KafkaJS.KafkaJSNoBrokerAvailableError;

declare module "@confluentinc/kafka-javascript" {
  namespace KafkaJS {
    abstract class BaseKafkaJSError {
      readonly message: string;
      readonly retriable: boolean;
      readonly fatal: boolean;
      readonly abortable: boolean;
      readonly code: number;
      readonly stack: string;
      readonly type: string;
    }

    /**
     * Represents an error when using the promisified interface.
     */
    class KafkaJSError extends BaseKafkaJSError {
      _tag: "KafkaJSError";
      readonly name: "KafkaJSError";
    }

    /**
     * Represents an error that is caused when a Kafka Protocol RPC has an embedded error.
     */
    class KafkaJSProtocolError extends BaseKafkaJSError {
      _tag: "KafkaJSProtocolError";
      readonly name: "KafkaJSProtocolError";
    }

    /**
     * Represents the error raised when fetching from an offset out of range.
     */
    class KafkaJSOffsetOutOfRange extends BaseKafkaJSError {
      _tag: "KafkaJSOffsetOutOfRange";
      readonly name: "KafkaJSOffsetOutOfRange";
    }

    /**
     * Represents the error raised when a connection to a broker cannot be established or is broken unexpectedly.
     */
    class KafkaJSConnectionError extends BaseKafkaJSError {
      _tag: "KafkaJSConnectionError";
      readonly name: "KafkaJSConnectionError";
    }

    /**
     * Represents the error raised on a timeout for one request.
     */
    class KafkaJSRequestTimeoutError extends BaseKafkaJSError {
      _tag: "KafkaJSRequestTimeoutError";
      readonly name: "KafkaJSRequestTimeoutError";
    }

    /**
     * Represents the error raised when a response does not contain all expected information.
     */
    class KafkaJSPartialMessageError extends BaseKafkaJSError {
      _tag: "KafkaJSPartialMessageError";
      readonly name: "KafkaJSPartialMessageError";
    }

    /**
     * Represents an error raised when authentication fails.
     */
    class KafkaJSSASLAuthenticationError extends BaseKafkaJSError {
      _tag: "KafkaJSSASLAuthenticationError";
      readonly name: "KafkaJSSASLAuthenticationError";
    }

    /**
     * Represents an error raised when a feature is not implemented for this particular client.
     */
    class KafkaJSNotImplemented extends BaseKafkaJSError {
      _tag: "KafkaJSNotImplemented";
      readonly name: "KafkaJSNotImplemented";
    }

    /**
     * Represents an error raised when a timeout for an operation occurs (including retries).
     */
    class KafkaJSTimeout extends BaseKafkaJSError {
      _tag: "KafkaJSTimeout";
      readonly name: "KafkaJSTimeout";
    }

    /**
     * Represents an error raised when no broker is available for the operation.
     */
    class KafkaJSNoBrokerAvailableError extends BaseKafkaJSError {
      _tag: "KafkaJSNoBrokerAvailableError";
      readonly name: "KafkaJSNoBrokerAvailableError";
    }
  }
}

KafkaJSError.prototype._tag = "KafkaJSError";
KafkaJSProtocolError.prototype._tag = "KafkaJSProtocolError";
KafkaJSOffsetOutOfRange.prototype._tag = "KafkaJSOffsetOutOfRange";
KafkaJSConnectionError.prototype._tag = "KafkaJSConnectionError";
KafkaJSRequestTimeoutError.prototype._tag = "KafkaJSRequestTimeoutError";
KafkaJSPartialMessageError.prototype._tag = "KafkaJSPartialMessageError";
KafkaJSSASLAuthenticationError.prototype._tag = "KafkaJSSASLAuthenticationError";
KafkaJSNotImplemented.prototype._tag = "KafkaJSNotImplemented";
KafkaJSTimeout.prototype._tag = "KafkaJSTimeout";
KafkaJSNoBrokerAvailableError.prototype._tag = "KafkaJSNoBrokerAvailableError";

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
  | KafkaJSTimeout
  | KafkaJSNoBrokerAvailableError;

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
  error instanceof KafkaJSTimeout ||
  error instanceof KafkaJSNoBrokerAvailableError;

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
  KafkaJSNoBrokerAvailableError,
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
