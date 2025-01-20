import { afterEach, beforeEach, describe, expect, it } from "@effect/vitest";
import Substitute, { SubstituteOf } from "@fluffy-spoon/substitute";
import { Effect } from "effect";
import { Admin } from "../src";
import { TestAdmin, TestInstance, testKafkaInstanceLayer } from "./mocks/TestKafkaInstance";

describe("Admin", () => {
  let kafkaSub: SubstituteOf<TestInstance>;
  let adminSub: SubstituteOf<TestAdmin>;

  beforeEach(() => {
    kafkaSub = Substitute.for<TestInstance>();
    adminSub = Substitute.for<TestAdmin>();
    adminSub.connect().returns(Effect.void);
    adminSub.disconnect().returns(Effect.void);
    adminSub.listTopics().returns(Effect.succeed([]));
    kafkaSub.admin().returns(adminSub);
  });

  afterEach(() => {
    // Assert that scope was released
    adminSub.received(1).disconnect();
  });

  it.effect("should list topics", () =>
    Effect.gen(function* () {
      const result = yield* Admin.listTopics();

      expect(result).toEqual([]);
      kafkaSub.received(1).admin();
      adminSub.received(1).connect();
      adminSub.didNotReceive().disconnect(); // Scope is released on Admin layer finalization
      adminSub.received(1).listTopics();
    }).pipe(Effect.provide(Admin.layer()), Effect.provide(testKafkaInstanceLayer(kafkaSub))),
  );
});
