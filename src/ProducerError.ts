import { Data } from "effect";

/**
 * @since 0.5.0
 * @category error
 */
export type ProducerError = UnknownProducerError;

/**
 * @since 0.5.0
 * @category error
 */
export class UnknownProducerError extends Data.TaggedError("UnknownProducerError")<{
  readonly message: string;
}> {
  constructor(options: { readonly message: string; readonly stack?: string }) {
    super(options);
    (this as any).stack = options.stack ?? `${this.name}: ${this.message}`;
  }
}
