import { Changesets, Husky, VscodeExtensionRecommendations } from "@floydspace/projen-components";
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
    "pre-push": ["CI=true pnpm test", "pnpm docgen"],
  },
});

new Docgen(project, { repoOwner: org });

new Changesets(project, { repo });

const recommendations = new VscodeExtensionRecommendations(project);
recommendations.addRecommendations("effectful-tech.effect-vscode");

project.addDevDeps("@effect/platform-node");
project.addPeerDeps("effect", "@effect/platform");

project.addPeerDeps("kafkajs", "@confluentinc/kafka-javascript");
project.package.addField("peerDependenciesMeta", {
  kafkajs: { optional: true },
  "@confluentinc/kafka-javascript": { optional: true },
});

project.tsconfigDev.addInclude("examples");
project.eslint?.addOverride({
  files: ["examples/**/*.ts"],
  rules: { "import/no-extraneous-dependencies": "off" },
});

project.synth();
