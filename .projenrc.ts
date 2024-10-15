import { javascript, typescript } from "projen";

const project = new typescript.TypeScriptProject({
  defaultReleaseBranch: "main",
  name: "effect-kafka",
  packageManager: javascript.NodePackageManager.PNPM,
  typescriptVersion: "~5.5.4",
  projenrcTs: true,
  prettier: true,
  github: false,
  jestOptions: {
    configFilePath: "jest.config.json",
  },
});

project.synth();
