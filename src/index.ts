#!/usr/bin/env node
/* eslint-disable no-use-before-define */

import findUp from "find-up";
import * as fs from "fs";
import { prompt } from "enquirer";
import { program } from "@caporal/core";

type Variable = {
    name: string;
    description: string;
    type: "number" | "string" | "boolean";
    default: string;
}

type ContainerEnvConfig = {
    container: {
        name: string;
        scope: string;
    };
    variables: Variable[];
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageInfo = require("../package.json");

const CONFIG_FILE_NAME = "container-env.json";

export function cli(): void {
    program
        .name("container-env")
        .bin("cenv")
        .version(packageInfo.version)
        .description(packageInfo.description)

        .command("add", "Add variables")
        .action(async ({ logger }) => {
            const configFile = await findUp(CONFIG_FILE_NAME);
            if (!configFile || !fs.existsSync(configFile)) {
                logger.error(`No '${CONFIG_FILE_NAME}' file found. Exiting.`);
                return;
            }
            const config = JSON.parse(fs.readFileSync(configFile).toString()) as ContainerEnvConfig;
            config.variables.push(...await askForVariables());
            fs.writeFileSync(CONFIG_FILE_NAME, JSON.stringify(config));
            logger.info("Done");
        })

        .command("generate", "Generate")
        .argument("<type>", "Can be 'compose' or 'run'")
        .option("-s, --save", "Save to disk")
        .action(async ({ logger, args, options }) => {
            const configFile = await findUp(CONFIG_FILE_NAME);
            if (!configFile || !fs.existsSync(configFile)) {
                logger.error(`No '${CONFIG_FILE_NAME}' file found. Exiting.`);
                return;
            }
            const config = JSON.parse(fs.readFileSync(configFile).toString()) as ContainerEnvConfig;
            let isDockerRun;
            if (args.type == "compose") {
                isDockerRun = false;
            } else if (args.type == "run") {
                isDockerRun = true;
            } else {
                logger.error("Type must be either 'compose' or 'run'. Exiting.");
                return;
            }
            const data = isDockerRun ? `docker run ${config.container.scope}/${config.container.name} ${config.variables.map((v: { name: string, default: string }) => `-e ${v.name}=${v.default ? v.default : "CHANGE_ME"}`).join(" ")}
` : `version: "3"

services:
  ${config.container.name}:
    image: ${config.container.scope}/${config.container.name}
    environment:
${config.variables.map((v: { name: string, default: string }) => `      - ${v.name}=${v.default ? v.default : "CHANGE_ME"}`).join("\n")}`;
            if (options.save) {
                const filename = isDockerRun ? "run-in-docker.sh" : "docker-compose.yml";
                if (!fs.existsSync(filename) || ((await prompt({ name: "result", type: "confirm", message: `'${filename}' already exists. Do you want to overwrite it?` })) as any).result) {
                    fs.writeFileSync(filename, data);
                    return;
                }
            }
            // eslint-disable-next-line no-console
            console.log("\n");
            // eslint-disable-next-line no-console
            console.log(data);
            // eslint-disable-next-line no-console
            console.log("\n");
        })

        .command("init", "Initialize")
        .action(async ({ logger }) => {
            const { container } = await prompt({
                type: "form",
                name: "container",
                message: "Please provide the following information:",
                choices: [
                    { name: "name", message: "Container name", initial: "" },
                    { name: "scope", message: "Container scope", initial: "" },
                ] as any[],
            });

            const variables = await askForVariables();
            fs.writeFileSync(CONFIG_FILE_NAME, JSON.stringify({
                container,
                variables,
            }));
            logger.info("Done");
        });

    // always run the program at the end
    program.run();
}

async function askForVariables(): Promise<Variable[]> {
    const variables: Variable[] = [];

    do {
        const { type } = (await prompt({
            name: "type",
            type: "select",
            message: "Select the type",
            choices: [
                {
                    name: "string",
                },
                {
                    name: "number",
                },
                {
                    name: "boolean",
                },
            ],
        })) as any;
        const result = await prompt({
            type: "form",
            name: "variable",
            message: "Please provide the following information:",
            choices: [
                { name: "name", message: "Name", initial: "" },
                { name: "description", message: "Description", initial: "" },
                { name: "default", message: "Default value", initial: "" },
            ] as any[],
        });
        (result as any).default = type == "number"
            ? parseInt((result as any).default, 10)
            : (result as any).default;
        (result as any).variable.name = (result as any).variable.name.toUpperCase().replace(/ /g, "_");
        variables.push((result as any).variable);
    } while (((await prompt({ type: "confirm", message: "Do you want to add a variable?", name: "result" })) as any).result);
    return variables;
}

export function getConfig(containerEnvConfig: {variables: Variable[]}, configPath = "/app/config/config.json"): Record<string, string> {
    let config = {} as Record<string, string>;
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath).toString());
    } else {
        fs.writeFileSync(configPath, JSON.stringify({}));
    }
    for (const key of Object.keys(containerEnvConfig.variables)) {
        if (config.key !== process.env[key]) {
            config[key] = process.env[key] || "";
        } else {
            config[key] = containerEnvConfig.variables.find((v) => v.name == key)?.default || "";
        }
    }
    fs.writeFileSync(configPath, JSON.stringify(config));
    return config;
}
