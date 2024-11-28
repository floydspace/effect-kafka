import { afterEach, beforeEach, describe, expect, it, vi } from "@effect/vitest";
import Substitute, { Arg, SubstituteOf } from "@fluffy-spoon/substitute";
import { Cause, Effect, Exit, Fiber, Layer } from "effect";
import { Consumer, ConsumerRecord, MessageRouter } from "../src";
import { TestConsumer, TestInstance, testKafkaInstanceLayer } from "./mocks/TestKafkaInstance";

const runPromiseWithInterruption = <A, E>(effect: Effect.Effect<A, E>) => {
  const fiber = Effect.runFork(effect);
  return Effect.sleep(0).pipe(
    Effect.andThen(() => Fiber.interrupt(fiber)),
    Effect.runPromise,
  );
};

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
      ConsumerRecord.make({
        ...ConsumerRecord.empty,
        offset: "1",
        topic: "test-topic",
      }),
    ]);
    kafkaSub.consumer().returns(consumerSub);
  });

  afterEach(() => {
    // Assert that scope was released
    consumerSub.received(1).disconnect();
  });

  it("should receive message", async () => {
    expect.assertions(4);

    const procedure = vi.fn();

    const program = await MessageRouter.empty.pipe(
      MessageRouter.subscribe(
        "test-topic",
        Effect.tap(ConsumerRecord.ConsumerRecord, (r) => {
          procedure(r);
        }),
      ),
      Consumer.serve({ groupId: "group" }),
      Layer.launch,
      Effect.provide(testKafkaInstanceLayer(kafkaSub)),
      runPromiseWithInterruption,
    );

    consumerSub.received(1).subscribe(["test-topic"]);
    expect(Exit.isInterrupted(program)).toBe(true);
    expect(procedure).toHaveBeenCalledTimes(2);
    expect(procedure).toHaveBeenNthCalledWith(
      1,
      ConsumerRecord.make({
        ...ConsumerRecord.empty,
        topic: "test-topic",
      }),
    );
    expect(procedure).toHaveBeenNthCalledWith(
      2,
      ConsumerRecord.make({
        ...ConsumerRecord.empty,
        offset: "1",
        topic: "test-topic",
      }),
    );
  });

  it("should catchTag handle error", async () => {
    expect.assertions(2 * 2 + 1); // 2 assertions for each error + 1 for interruption

    const program = await MessageRouter.empty.pipe(
      MessageRouter.subscribe(
        "test-topic",
        Effect.flatMap(ConsumerRecord.ConsumerRecord, () => new Cause.UnknownException("Error processing message")),
      ),
      MessageRouter.catchTag("UnknownException", (e) => {
        expect(e).toBeInstanceOf(Cause.UnknownException);
        expect(e.error).toBe("Error processing message");
        return Effect.void;
      }),
      Consumer.serve({ groupId: "group" }),
      Layer.launch,
      Effect.provide(testKafkaInstanceLayer(kafkaSub)),
      runPromiseWithInterruption,
    );

    consumerSub.received(1).subscribe(["test-topic"]);
    expect(Exit.isInterrupted(program)).toBe(true);
  });

  it("should catchAll handle error", async () => {
    expect.assertions(2 * 2 + 1); // 2 assertions for each error + 1 for interruption

    const program = await MessageRouter.empty.pipe(
      MessageRouter.subscribe(
        "test-topic",
        Effect.flatMap(ConsumerRecord.ConsumerRecord, () => new Cause.UnknownException("Error processing message")),
      ),
      MessageRouter.catchAll((e) => {
        expect(e).toBeInstanceOf(Cause.UnknownException);
        expect(e.error).toBe("Error processing message");
        return Effect.void;
      }),
      Consumer.serve({ groupId: "group" }),
      Layer.launch,
      Effect.provide(testKafkaInstanceLayer(kafkaSub)),
      runPromiseWithInterruption,
    );

    consumerSub.received(1).subscribe(["test-topic"]);
    expect(Exit.isInterrupted(program)).toBe(true);
  });

  it("should catchAllCause handle error", async () => {
    expect.assertions(1 * 2 + 1); // 1 assertion for each error + 1 for interruption

    const program = await MessageRouter.empty.pipe(
      MessageRouter.subscribe(
        "test-topic",
        Effect.flatMap(ConsumerRecord.ConsumerRecord, () => new Cause.UnknownException("Error processing message")),
      ),
      MessageRouter.catchAllCause((e) => {
        expect(e).toStrictEqual(Cause.fail(new Cause.UnknownException("Error processing message")));
        return Effect.void;
      }),
      Consumer.serve({ groupId: "group" }),
      Layer.launch,
      Effect.provide(testKafkaInstanceLayer(kafkaSub)),
      runPromiseWithInterruption,
    );

    consumerSub.received(1).subscribe(["test-topic"]);
    expect(Exit.isInterrupted(program)).toBe(true);
  });

  it("should not handle error", async () => {
    expect.assertions(1);

    const program = await MessageRouter.empty.pipe(
      MessageRouter.subscribe(
        "test-topic",
        Effect.flatMap(ConsumerRecord.ConsumerRecord, () => new Cause.UnknownException("Error processing message")),
      ),
      Consumer.serve({ groupId: "group" }),
      Layer.launch,
      Effect.provide(testKafkaInstanceLayer(kafkaSub)),
      runPromiseWithInterruption,
    );

    consumerSub.received(1).subscribe(["test-topic"]);
    expect(program).toStrictEqual(Exit.die(new Cause.UnknownException("Error processing message")));
  });
});
