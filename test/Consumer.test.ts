import { afterEach, beforeEach, describe, expect, it } from "@effect/vitest";
import Substitute, { Arg, SubstituteOf } from "@fluffy-spoon/substitute";
import { Cause, Effect, Exit } from "effect";
import { Consumer, ConsumerRecord, MessageRouter } from "../src";
import { TestConsumer, TestInstance, testKafkaInstanceLayer } from "./mocks/TestKafkaInstance";

describe("Consumer", () => {
  let kafkaSub: SubstituteOf<TestInstance>;
  let consumerSub: SubstituteOf<TestConsumer>;

  beforeEach(() => {
    kafkaSub = Substitute.for<TestInstance>();
    consumerSub = Substitute.for<TestConsumer>();
    consumerSub.connect().returns(Effect.void);
    consumerSub.disconnect().returns(Effect.void);
    consumerSub.subscribe(Arg.any()).returns(Effect.void);
    consumerSub.results.returns?.([
      ConsumerRecord.make({
        ...ConsumerRecord.empty,
        topic: "test-topic",
      }),
    ]);
    kafkaSub.consumer().returns(consumerSub);
  });

  afterEach(() => {
    // Assert that scope was released
    consumerSub.received(1).disconnect();
  });

  it.effect("should receive message", () =>
    Effect.gen(function* () {
      const record = ConsumerRecord.make({
        ...ConsumerRecord.empty,
        topic: "test-topic",
      });
      consumerSub.results.returns?.([record]);

      expect.assertions(1);

      yield* MessageRouter.empty.pipe(
        MessageRouter.subscribe(
          "test-topic",
          Effect.tap(ConsumerRecord.ConsumerRecord, (r) => {
            expect(r).toStrictEqual(record);
          }),
        ),
        Consumer.serveOnceEffect({ groupId: "group" }),
        Effect.scoped,
      );

      consumerSub.received(1).subscribe(["test-topic"]);
    }).pipe(Effect.provide(testKafkaInstanceLayer(kafkaSub))),
  );

  it.effect("should catchTag handle error", () =>
    Effect.gen(function* () {
      expect.assertions(2);

      yield* MessageRouter.empty.pipe(
        MessageRouter.subscribe(
          "test-topic",
          Effect.flatMap(ConsumerRecord.ConsumerRecord, () => new Cause.UnknownException("Error processing message")),
        ),
        MessageRouter.catchTag("UnknownException", (e) => {
          expect(e).toBeInstanceOf(Cause.UnknownException);
          expect(e.error).toBe("Error processing message");
          return Effect.void;
        }),
        Consumer.serveOnceEffect({ groupId: "group" }),
        Effect.scoped,
      );

      consumerSub.received(1).subscribe(["test-topic"]);
    }).pipe(Effect.provide(testKafkaInstanceLayer(kafkaSub))),
  );

  it.effect("should catchAll handle error", () =>
    Effect.gen(function* () {
      expect.assertions(2);

      yield* MessageRouter.empty.pipe(
        MessageRouter.subscribe(
          "test-topic",
          Effect.flatMap(ConsumerRecord.ConsumerRecord, () => new Cause.UnknownException("Error processing message")),
        ),
        MessageRouter.catchAll((e) => {
          expect(e).toBeInstanceOf(Cause.UnknownException);
          expect(e.error).toBe("Error processing message");
          return Effect.void;
        }),
        Consumer.serveOnceEffect({ groupId: "group" }),
        Effect.scoped,
      );

      consumerSub.received(1).subscribe(["test-topic"]);
    }).pipe(Effect.provide(testKafkaInstanceLayer(kafkaSub))),
  );

  it.effect("should catchAllCause handle error", () =>
    Effect.gen(function* () {
      expect.assertions(1);

      yield* MessageRouter.empty.pipe(
        MessageRouter.subscribe(
          "test-topic",
          Effect.flatMap(ConsumerRecord.ConsumerRecord, () => new Cause.UnknownException("Error processing message")),
        ),
        MessageRouter.catchAllCause((e) => {
          expect(e).toStrictEqual(Cause.fail(new Cause.UnknownException("Error processing message")));
          return Effect.void;
        }),
        Consumer.serveOnceEffect({ groupId: "group" }),
        Effect.scoped,
      );

      consumerSub.received(1).subscribe(["test-topic"]);
    }).pipe(Effect.provide(testKafkaInstanceLayer(kafkaSub))),
  );

  it("should not handle error", async () => {
    expect.assertions(1);

    const program = await MessageRouter.empty.pipe(
      MessageRouter.subscribe(
        "test-topic",
        Effect.flatMap(ConsumerRecord.ConsumerRecord, () => new Cause.UnknownException("Error processing message")),
      ),
      Consumer.serveOnceEffect({ groupId: "group" }),
      Effect.scoped,
      Effect.provide(testKafkaInstanceLayer(kafkaSub)),
      Effect.runPromiseExit,
    );

    consumerSub.received(1).subscribe(["test-topic"]);
    expect(program).toStrictEqual(Exit.die(new Cause.UnknownException("Error processing message")));
  });
});
