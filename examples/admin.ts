import { NodeRuntime } from "@effect/platform-node";
import { Effect } from "effect";
import { Admin } from "../src";
import { KafkaJS } from "../src/KafkaJS";

const program = Admin.listTopics().pipe(Effect.tap((topics) => Effect.log("Topics:", topics)));

const AdminLive = Admin.layer();
const KafkaLive = KafkaJS.layer({ brokers: ["localhost:19092"] });
const MainLive = program.pipe(Effect.provide(AdminLive), Effect.provide(KafkaLive));

NodeRuntime.runMain(MainLive);
