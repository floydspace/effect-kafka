import { afterEach, beforeEach, describe, expect, it } from "@effect/vitest";
import Substitute, { Arg, SubstituteOf } from "@fluffy-spoon/substitute";
import { Effect } from "effect";
import { Producer } from "../src";
import { TestInstance, testKafkaInstanceLayer, TestProducer } from "./mocks/TestKafkaInstance";

describe("Producer", () => {
  let kafkaSub: SubstituteOf<TestInstance>;
  let producerSub: SubstituteOf<TestProducer>;

  beforeEach(() => {
    kafkaSub = Substitute.for<TestInstance>();
    producerSub = Substitute.for<TestProducer>();
    producerSub.connect().returns(Effect.void);
    producerSub.disconnect().returns(Effect.void);
    producerSub.send(Arg.any()).returns(Effect.succeed([]));
    producerSub.sendBatch(Arg.any()).returns(Effect.succeed([]));
    kafkaSub.producer().returns(producerSub);
  });

  afterEach(() => {
    // Assert that scope was released
    producerSub.received(1).disconnect();
  });

  it.effect("should send message", () =>
    Effect.gen(function* () {
      const result = yield* Producer.send({
        topic: "test-topic",
        messages: [{ value: "Hello, effect-kafka user!" }, { value: "How are you, effect-kafka user?" }],
      });

      expect(result).toEqual([]);
      kafkaSub.received(1).producer();
      producerSub.received(1).connect();
      producerSub.didNotReceive().disconnect(); // Scope is released on Producer layer finalization
      producerSub.received(1).send({
        topic: "test-topic",
        messages: [{ value: "Hello, effect-kafka user!" }, { value: "How are you, effect-kafka user?" }],
      });
      producerSub.didNotReceive().sendBatch(Arg.all());
    }).pipe(Effect.provide(Producer.layer()), Effect.provide(testKafkaInstanceLayer(kafkaSub))),
  );

  it.effect("should send message scoped", () =>
    Effect.gen(function* () {
      const result = yield* Producer.sendScoped({
        topic: "test-topic",
        messages: [{ value: "Hello, effect-kafka user!" }, { value: "How are you, effect-kafka user?" }],
      }).pipe(Effect.scoped);

      expect(result).toEqual([]);
      kafkaSub.received(1).producer();
      producerSub.received(1).connect();
      producerSub.received(1).disconnect();
      producerSub.received(1).send({
        topic: "test-topic",
        messages: [{ value: "Hello, effect-kafka user!" }, { value: "How are you, effect-kafka user?" }],
      });
      producerSub.didNotReceive().sendBatch(Arg.all());
    }).pipe(Effect.provide(testKafkaInstanceLayer(kafkaSub))),
  );
});
