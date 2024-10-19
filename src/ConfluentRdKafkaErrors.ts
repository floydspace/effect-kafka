import { LibrdKafkaError as LibrdKafkaError$ } from "@confluentinc/kafka-javascript";
import { Data } from "effect";

/**
 * @since 0.2.0
 * @category errors
 */
export class LibrdKafkaError extends Data.TaggedError("LibrdKafkaError")<LibrdKafkaError$> {
  constructor(options: LibrdKafkaError$) {
    super(options);
    (this as any).stack = options.stack ?? `${this.name}: ${this.message}`;
  }
}

/**
 * @since 0.2.0
 * @category refinements
 */
export const isLibrdKafkaError = (u: unknown): u is LibrdKafkaError =>
  u instanceof Error && "errno" in u && "code" in u && "origin" in u;
