import { Changesets, Husky } from "@floydspace/projen-components";
import { javascript, typescript } from "projen";

const project = new typescript.TypeScriptProject({
  defaultReleaseBranch: "main",
  name: "effect-kafka",
  packageManager: javascript.NodePackageManager.PNPM,
  typescriptVersion: "~5.5.4",
  pnpmVersion: "8",
  projenrcTs: true,
  prettier: true,
  github: true,
  githubOptions: { mergify: false, pullRequestLint: false },
  release: false,
  buildWorkflowOptions: { mutableBuild: false },
  pullRequestTemplate: false,
  workflowNodeVersion: "lts/*",
  workflowPackageCache: true,
  depsUpgrade: false,
  jestOptions: {
    configFilePath: "jest.config.json",
  },
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

project.synth();
