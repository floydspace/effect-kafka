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

project.addGitIgnore(".direnv/"); // flake environment creates .direnv folder
project.addPackageIgnore("/.envrc");
project.addPackageIgnore("/flake.lock");
project.addPackageIgnore("/flake.nix");
project.addPackageIgnore("/docker-compose.yml");

// Effect dependencies
project.addDevDeps("@effect/platform-node", "@effect/vitest", "@fluffy-spoon/substitute");
project.addPeerDeps("effect");

// Kafka dependencies
project.addPeerDeps("kafkajs@^2", "@confluentinc/kafka-javascript@>=0.2.1 <1.0.0");
project.addFields({
  peerDependenciesMeta: {
    kafkajs: { optional: true },
    "@confluentinc/kafka-javascript": { optional: true },
  },
});

project.synth();
