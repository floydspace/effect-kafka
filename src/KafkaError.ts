import { Data } from "effect";

/**
 * @since 0.6.0
 * @category error
 */
export type KafkaError = ConnectionException;

/**
 * @since 0.2.0
 * @category error
 */
export class ConnectionException extends Data.TaggedError("ConnectionException")<{
  readonly broker?: string;
  readonly message: string;
}> {
  constructor(options: { readonly broker?: string; readonly message: string; readonly stack?: string }) {
    super(options);
    (this as any).stack = options.stack ?? `${this.name}: ${this.message}`;
  }
}
