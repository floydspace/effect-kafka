/**
 * @since 0.9.0
 */
import { Either, Encoding, ParseResult, Schema } from "effect";

/**
 * @category Uint8Array transformations
 * @since 0.9.0
 */
export const Uint8ArrayToBase64 = Schema.transformOrFail(
  Schema.Uint8ArrayFromSelf,
  Schema.String.annotations({ description: "a string that will be parsed into a Uint8Array" }),
  {
    strict: true,
    decode: (u) => ParseResult.succeed(Encoding.encodeBase64(u)),
    encode: (s, _, ast) =>
      Either.mapLeft(
        Encoding.decodeBase64(s),
        (decodeException) => new ParseResult.Type(ast, s, decodeException.message),
      ),
  },
).annotations({ identifier: "Uint8ArrayToBase64" });

/**
 * @category primitives
 * @since 0.9.0
 */
export const String = Uint8ArrayToBase64.pipe(Schema.compose(Schema.StringFromBase64));

/**
 * @category primitives
 * @since 0.9.0
 */
export const Number = String.pipe(Schema.compose(Schema.NumberFromString));
