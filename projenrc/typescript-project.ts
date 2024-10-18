import { JsonFile, javascript, typescript } from "projen";

type PredefinedProps = "defaultReleaseBranch" | "authorName" | "authorEmail";

export type TypeScriptLibProjectOptions = Omit<typescript.TypeScriptProjectOptions, PredefinedProps> &
  Partial<Pick<typescript.TypeScriptProjectOptions, PredefinedProps>>;

export class TypeScriptLibProject extends typescript.TypeScriptProject {
  constructor({ jestOptions: { jestConfig, ...jestOptions } = {}, ...options }: TypeScriptLibProjectOptions) {
    const parent = options.parent as javascript.NodeProject | undefined;
    super({
      defaultReleaseBranch: "main",
      authorEmail: "ifloydrose@gmail.com",
      authorName: "Victor Korzunin",
      homepage: parent?.package.manifest.homepage,
      projenrcTs: true,
      license: "MIT",
      packageManager: javascript.NodePackageManager.PNPM,
      pnpmVersion: "8",
      prettier: true,
      projenVersion: parent?.deps.getDependency("projen").version,
      typescriptVersion: parent?.deps.getDependency("typescript").version,
      package: false, // It will be created by @changesets/cli
      depsUpgrade: false,
      clobber: false, // enable it and run `pnpm default && pnpm clobber`, if you need to reset the project
      jest: true,
      jestOptions: {
        ...jestOptions,
        configFilePath: "jest.config.json",
        junitReporting: false,
      },
      tsconfig: {
        compilerOptions: {
          moduleResolution: javascript.TypeScriptModuleResolution.NODE,
          lib: ["es2019", "dom"],
        },
      },
      ...options,
      name: `${options.name}`,
      devDeps: [...(options.devDeps ?? []), "only-allow"],
    });

    this.addScripts({
      preinstall: `npx only-allow ${this.package.packageManager}`,
    });

    this.package.addEngine("pnpm", ">=8 <9");

    // Add tsconfig for esm
    new JsonFile(this, "tsconfig.esm.json", {
      obj: {
        extends: "./tsconfig.json",
        compilerOptions: {
          outDir: "./lib/esm",
          module: "es6", // esm
          resolveJsonModule: false, // JSON modules are not supported in esm
          declaration: false, // Declaration are generated for cjs
        },
      },
    });

    // Build both cjs and esm
    this.compileTask.reset("tsc -b ./tsconfig.json ./tsconfig.esm.json");

    this.npmignore?.addPatterns("/tsconfig.esm.json");

    this.addFields({
      // Reference to esm index for root imports
      module: "lib/esm/index.js",
      publishConfig: { access: "public" },
      sideEffects: [],
    });
  }
}
