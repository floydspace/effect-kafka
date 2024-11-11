import { afterEach, beforeEach, describe, expect, it } from "@effect/vitest";
import Substitute, { Arg, SubstituteOf } from "@fluffy-spoon/substitute";
import { Effect } from "effect";
import type * as KafkaJS from "kafkajs";
import { Producer } from "../src";
import { testKafkaInstanceLayer } from "./mocks/TestKafkaInstance";

describe("Producer", () => {
  let kafkaSub: SubstituteOf<KafkaJS.Kafka>;
  let producerSub: SubstituteOf<KafkaJS.Producer>;

  beforeEach(() => {
    kafkaSub = Substitute.for<KafkaJS.Kafka>();
    producerSub = Substitute.for<KafkaJS.Producer>();
    producerSub.connect().resolves();
    producerSub.disconnect().resolves();
    producerSub.send(Arg.any()).resolves([]);
    producerSub.sendBatch(Arg.any()).resolves([]);
    kafkaSub.producer(Arg.any()).returns(producerSub);
  });

  afterEach(() => {
    // Assert that scope was released
    producerSub.received(1).disconnect();
  });

  it.effect("send", () =>
    Effect.gen(function* (_) {
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

  it.effect("sendScoped", () =>
    Effect.gen(function* (_) {
      const result = yield* Producer.sendScoped({
        topic: "test-topic",
        messages: [{ value: "Hello, effect-kafka user!" }, { value: "How are you, effect-kafka user?" }],
      }).pipe(Effect.scoped);

      expect(result).toEqual([]);
      kafkaSub.received(1).producer({});
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
