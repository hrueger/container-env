#!/usr/bin/env node

const packageInfo = require("../package.json");
import findUp from "find-up";
import * as fs from "fs";
import { prompt } from 'enquirer';
import { program } from "@caporal/core";

const CONFIG_FILE_NAME = "container-env.json";

export const cli = (argv: string[]) => {
    program
        .name("container-env")
        .bin("cenv")
        .version(packageInfo.version)
        .description(packageInfo.description)

        .command("generate", "Generate")
        .argument("<type>", "Can be 'compose' or 'run'")
        .option("-s, --save", "Save to disk")
        .action(async ({ logger, args, options }) => {
            const configFile = await findUp(CONFIG_FILE_NAME);
            if (!configFile || !fs.existsSync(configFile)) {
                logger.error(`No '${CONFIG_FILE_NAME}' file found. Exiting.`)
                return;
            }
            const config = JSON.parse(fs.readFileSync(configFile).toString());
            let isDockerRun;
            if (args.type == "compose") {
                isDockerRun = false;
            } else if (args.type == "run") {
                isDockerRun = true;
            } else {
                logger.error(`Type must be either 'compose' or 'run'. Exiting.`)
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
            console.log("\n");
            console.log(data);
            console.log("\n");
            
        })


    // always run the program at the end
    program.run()
}