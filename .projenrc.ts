import { Changesets, Husky, VscodeExtensionRecommendations } from "@floydspace/projen-components";
import { YamlFile } from "projen";
import { Docgen, Examples, TypeScriptLibProject } from "./projenrc";

const org = "floydspace";
const name = "effect-kafka";
const repo = `${org}/${name}`;

const project = new TypeScriptLibProject({
  name: name,
  description: "📨 Effectful Kafka",
  keywords: [
    "ecosystem",
    "typescript",
    "kafka",
    "kafka-consumer",
    "kafka-producer",
    "kafka-client",
    "effect",
    "confluent-kafka",
    "kafkajs",
    "rdkafka",
    "effect-ts",
  ],
  repository: `https://github.com/${org}/${name}.git`,
  homepage: `https://${org}.github.io/${name}`,
  typescriptVersion: "~5.6.3", // Limited by @typescript-eslint v8
  prettierOptions: { settings: { printWidth: 120 } },
  github: true,
  githubOptions: { mergify: false, pullRequestLint: false },
  release: false,
  buildWorkflowOptions: { mutableBuild: false },
  pullRequestTemplate: false,
  workflowNodeVersion: "lts/*",
  workflowPackageCache: true,
  devDeps: ["@floydspace/projen-components", "tsx"],
});

project.defaultTask?.reset("tsx .projenrc.ts");

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

project.addGitIgnore(".direnv/"); // flake environment creates .direnv folder
project.addPackageIgnore("/.envrc");
project.addPackageIgnore("/flake.lock");
project.addPackageIgnore("/flake.nix");
project.addPackageIgnore("/docker-compose.yml");

// Effect dependencies
project.addDevDeps(
  "@effect/platform@0.69.0",
  "@effect/platform-node@0.64.0",
  "@effect/vitest@0.13.0",
  "@fluffy-spoon/substitute",
);
project.addPeerDeps("effect@^3.10.0");

// Kafka dependencies
project.addPeerDeps("kafkajs@^2", "@confluentinc/kafka-javascript@>=0.2.1 <1.0.0", "@platformatic/kafka@^1.7");
project.addFields({
  peerDependenciesMeta: {
    kafkajs: { optional: true },
    "@confluentinc/kafka-javascript": { optional: true },
    "@platformatic/kafka": { optional: true },
  },
});

// Build utils
project.addDevDeps("@effect/build-utils");
project.postCompileTask.exec("build-utils pack-v2");
project.addFields({ publishConfig: { access: "public", directory: "dist" } });

// Pages
project.addDevDeps("vitepress");
project.addTask("pages:dev", { exec: "vitepress dev pages" });
project.addTask("pages:build", { exec: "vitepress build pages" });
project.addTask("pages:preview", { exec: "vitepress preview pages" });

project.synth();
