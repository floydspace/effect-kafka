import { Changesets, Husky } from "@floydspace/projen-components";
import { TypeScriptLibProject } from "./projenrc";

const project = new TypeScriptLibProject({
  name: "effect-kafka",
  typescriptVersion: "~5.5.4",
  prettierOptions: {
    settings: { printWidth: 120 },
  },
  github: true,
  githubOptions: { mergify: false, pullRequestLint: false },
  release: false,
  buildWorkflowOptions: { mutableBuild: false },
  pullRequestTemplate: false,
  workflowNodeVersion: "lts/*",
  workflowPackageCache: true,
  devDeps: ["@floydspace/projen-components@next"],
});

new Husky(project, {
  huskyHooks: {
    "pre-push": ["CI=true pnpm test"],
  },
});

new Changesets(project, {
  repo: "floydspace/effect-kafka",
});

project.addPeerDeps("kafkajs", "@confluentinc/kafka-javascript");
project.package.addField("peerDependenciesMeta", {
  kafkajs: { optional: true },
  "@confluentinc/kafka-javascript": { optional: true },
});

project.addPeerDeps("effect", "@effect/platform", "@effect/platform-node");

project.synth();
