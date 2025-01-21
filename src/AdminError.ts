/**
 * @since 0.7.0
 */
import { Data } from "effect";

/**
 * @since 0.7.0
 * @category error
 */
export type AdminError = UnknownAdminError;

/**
 * @since 0.7.0
 * @category error
 */
export class UnknownAdminError extends Data.TaggedError("UnknownAdminError")<{
  readonly message: string;
}> {
  constructor(options: { readonly message: string; readonly stack?: string }) {
    super(options);
    (this as any).stack = options.stack ?? `${this.name}: ${this.message}`;
  }
}
