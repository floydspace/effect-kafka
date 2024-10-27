import { Changesets, Husky, VscodeExtensionRecommendations } from "@floydspace/projen-components";
import { YamlFile } from "projen";
import { Docgen, Examples, TypeScriptLibProject } from "./projenrc";

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

new YamlFile(project, ".github/FUNDING.yml", { obj: { github: org } });

new Husky(project, {
  huskyHooks: {
    "pre-push": ["CI=true pnpm test", "pnpm docgen"],
  },
});

new Docgen(project, { repoOwner: org });

new Changesets(project, { repo });

const recommendations = new VscodeExtensionRecommendations(project);
recommendations.addRecommendations("effectful-tech.effect-vscode");

new Examples(project);

project.addPackageIgnore("/docker-compose.yml");

// Effect dependencies
project.addDevDeps("@effect/platform-node");
project.addPeerDeps("effect");

// Kafka dependencies
project.addPeerDeps("kafkajs", "@confluentinc/kafka-javascript");
project.addFields({
  peerDependenciesMeta: {
    kafkajs: { optional: true },
    "@confluentinc/kafka-javascript": { optional: true },
  },
});

project.synth();
