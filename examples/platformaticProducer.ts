import { NodeRuntime } from "@effect/platform-node";
import { Effect } from "effect";
import { Producer } from "../src";
import { PlatformaticKafka } from "../src/PlatformaticKafka";

const program = Producer.sendScoped({
  topic: "events",
  messages: [
    {
      key: "user-123",
      value: JSON.stringify({ name: "John", action: "login" }),
      headers: { source: "web-app" },
    },
  ],
});

const PlatformaticLive = PlatformaticKafka.layer({
  clientId: "my-producer",
  bootstrapBrokers: ["localhost:9092"],
});
const MainLive = Effect.scoped(program).pipe(Effect.provide(PlatformaticLive));

NodeRuntime.runMain(MainLive);
