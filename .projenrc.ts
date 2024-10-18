import { Changesets, Husky } from "@floydspace/projen-components";
import { Docgen, TypeScriptLibProject } from "./projenrc";

const org = "floydspace";
const name = "effect-kafka";
const repo = `${org}/${name}`;

const project = new TypeScriptLibProject({
  name: name,
  homepage: `https://${org}.github.io/${name}`,
  typescriptVersion: "~5.5.4",
  prettierOptions: { settings: { printWidth: 120 } },
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

new Docgen(project);

new Changesets(project, { repo });

project.addPeerDeps("kafkajs", "@confluentinc/kafka-javascript");
project.package.addField("peerDependenciesMeta", {
  kafkajs: { optional: true },
  "@confluentinc/kafka-javascript": { optional: true },
});

project.addPeerDeps("effect", "@effect/platform", "@effect/platform-node");

project.tsconfigDev.addInclude("examples");

project.synth();
