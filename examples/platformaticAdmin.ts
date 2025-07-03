import { NodeRuntime } from "@effect/platform-node";
import { Effect } from "effect";
import { Admin } from "../src";
import { PlatformaticKafka } from "../src/PlatformaticKafka";

const program = Admin.listTopics().pipe(Effect.tap((topics) => Effect.log("Topics:", topics)));

const AdminLive = Admin.layer();
const KafkaLive = PlatformaticKafka.layer({ clientId: "my-admin", bootstrapBrokers: ["localhost:9092"] });
const MainLive = program.pipe(Effect.provide(AdminLive), Effect.provide(KafkaLive));

NodeRuntime.runMain(MainLive);
