# container-env
[![Available on npm](https://img.shields.io/npm/v/container-env)](https://npmjs.com/package/container-env)
![Lint](https://github.com/hrueger/container-env/workflows/Lint/badge.svg)
[![License](https://img.shields.io/badge/License-MIT-blue)](./LICENSE.md)
[![GitHub last commit](https://img.shields.io/github/last-commit/hrueger/container-env?color=brightgreen)](https://github.com/hrueger/container-env/commits)
[![Maintenance](https://img.shields.io/maintenance/yes/2021)](https://github.com/hrueger/container-env/commits)

> An environment variable management tool for Node.js apps running inside containers

## Installation
```sh
npm install container-env
```
or globally:
```sh
npm install container-env --global
```
or run it with npx:
```
npx container-env
```

## Usage
You need to create a `container-env.json` file. The cli can help you with this. After the installation it is available by typing `container-env` or by using the alias `cenv`.

Create a config file:
```
container-env init
```

Answer the questions. All variable names will be transformed to uppercase and spaces will be replaced with underscores ( `_` ).

You can then get the configuration read from the env variables like so:
```TypeScript
import { getConfig } from "container-env";

const config = getConfig(JSON.parse(fs.readFileSync(path.join(__dirname, "../../container-env.json")).toString()));
```
The `getConfig()` function takes one mandatory and one optional parameter: the first one needs to be the configuration object (you just need to read and parse the `container-env.json` file). You can optionally specify a path where the effective config should be saved.

## Helpers
### Add variables
Just type
```sh
container-env add
```
### Generate run scripts
You can generate a `docker-compose.yml` or a `docker run` command by typing
```sh
container-env generate compose
```
or
```sh
container-env generate run
```
The `-s` flag saves the output to a file in the current working directory.


## Help
Just run
```sh
container-env help
```
to display all available commands and their explaination.

## License
MIT
