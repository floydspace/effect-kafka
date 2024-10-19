import { Component, typescript } from "projen";

export class Examples extends Component {
  constructor(project: typescript.TypeScriptProject) {
    super(project);

    project.tsconfigDev.addInclude("examples");
    project.addPackageIgnore("/examples");
    project.eslint?.addOverride({
      files: ["examples/**/*.ts"],
      rules: { "import/no-extraneous-dependencies": "off" },
    });
  }
}
