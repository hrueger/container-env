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



    // always run the program at the end
    program.run()
}