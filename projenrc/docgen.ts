import { Component, JsonFile, Project, github, javascript } from "projen";

/**
 * Options for configuring the Docgen component.
 */
export interface DocgenOptions {
  /**
   * The GitHub username owning the repository.
   */
  readonly repoOwner?: string;

  /**
   * The name of the main release branch.
   *
   * @default "main"
   */
  readonly defaultReleaseBranch?: string;
}

export class Docgen extends Component {
  public static of(project: Project): Docgen | undefined {
    const isDocgen = (o: Component): o is Docgen => o instanceof Docgen;
    return project.components.find(isDocgen);
  }

  constructor(project: javascript.NodeProject, options?: DocgenOptions) {
    super(project);

    const branchName = options?.defaultReleaseBranch ?? "main";

    project.addDevDeps("@effect/docgen");

    const docgenTask = project.addTask("docgen", { exec: "docgen" });

    new JsonFile(project, "docgen.json", {
      obj: {
        $schema: "./node_modules/@effect/docgen/schema.json",
        exclude: ["src/internal/**/*.ts", "src/*/internal/**/*.ts"],
      },
      omitEmpty: true,
    });

    project.addGitIgnore("/docs");
    project.addPackageIgnore("/docs");
    project.addPackageIgnore("/docgen.json");

    const ghProject = github.GitHub.of(project.root);
    if (ghProject) {
      const setupSteps = project.renderWorkflowSetup().map((step) => ({
        ...step,
        uses: step.uses?.replace("pnpm/action-setup@v3", "pnpm/action-setup@v4"),
      }));

      const workflow = new github.GithubWorkflow(ghProject, "pages", {
        limitConcurrency: true,
        concurrencyOptions: {
          group: "${{ github.workflow }}-${{ github.ref }}",
          cancelInProgress: true,
        },
      });

      workflow.on({
        push: { branches: [branchName] },
        pullRequest: { branches: [branchName] },
        workflowDispatch: {}, // allow manual triggering
      });

      const condition = options?.repoOwner
        ? `github.repository_owner == '${options.repoOwner}' && github.event_name == 'push' && github.ref == 'refs/heads/${branchName}'`
        : undefined;

      const buildJob = new github.TaskWorkflowJob(this, docgenTask, {
        permissions: {},
        preBuildSteps: setupSteps,
        postBuildSteps: [
          {
            if: condition,
            name: "Build pages Jekyll",
            uses: "actions/jekyll-build-pages@v1",
            with: { source: "./docs", destination: "./_site" },
          },
          {
            if: condition,
            name: "Upload pages artifact",
            uses: "actions/upload-pages-artifact@v3",
          },
        ],
      });
      workflow.addJob("build", buildJob);
      workflow.addJob("deploy", {
        if: condition,
        name: "Deploy",
        needs: ["build"],
        runsOn: ["ubuntu-latest"],
        timeoutMinutes: 10,
        permissions: {
          pages: github.workflows.JobPermission.WRITE, // To deploy to GitHub Pages
          idToken: github.workflows.JobPermission.WRITE, // To verify the deployment originates from an appropriate source
        },
        environment: {
          name: "github-pages",
          url: "${{ steps.deployment.outputs.page_url }}",
        },
        steps: [{ name: "Deploy to GitHub Pages", id: "deployment", uses: "actions/deploy-pages@v2" }],
      });
    }
  }
}
