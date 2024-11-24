/**
 * @since 0.2.0
 */
import { LibrdKafkaError as LibrdKafkaError$ } from "@confluentinc/kafka-javascript";
import { Data } from "effect";

/**
 * @since 0.6.0
 * @category errors
 */
export class QueueFullError extends Data.TaggedError("QueueFullError")<LibrdKafkaError$> {
  constructor(options: LibrdKafkaError$) {
    super(options);
    (this as any).stack = options.stack ?? `${this.name}: ${this.message}`;
  }
}

/**
 * @since 0.2.0
 * @category errors
 */
export class LibRdKafkaError extends Data.TaggedError("LibRdKafkaError")<LibrdKafkaError$> {
  constructor(options: LibrdKafkaError$) {
    super(options);
    (this as any).stack = options.stack ?? `${this.name}: ${this.message}`;
  }
}

/**
 * @since 0.2.0
 * @category refinements
 */
export const isLibRdKafkaError = (u: unknown): u is LibRdKafkaError =>
  u instanceof Error && "errno" in u && "code" in u && "origin" in u;
