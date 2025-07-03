import { NodeRuntime } from "@effect/platform-node";
import { Effect } from "effect";
import { Producer } from "../src";
import { PlatformaticKafka } from "../src/PlatformaticKafka";

const program = Producer.sendScoped({
  topic: "test-topic",
  messages: [{ value: "Hello effect-kafka user!" }],
}).pipe(Producer.withProducerOptions({ allowAutoTopicCreation: true }));

const PlatformaticLive = PlatformaticKafka.layer({
  clientId: "my-producer",
  bootstrapBrokers: ["localhost:29092"],
});
const MainLive = Effect.scoped(program).pipe(Effect.provide(PlatformaticLive));

NodeRuntime.runMain(MainLive);
