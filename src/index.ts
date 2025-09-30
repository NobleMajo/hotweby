#!/usr/bin/env node

import { Option, program } from "commander"
import * as afs from "fs/promises"
import * as path from "path"
import { fileURLToPath } from "url"
import {
    createExpress,
    createReloadHtmlCode,
    createWebSocketServer,
} from "./server.js"

const executrionDir = process.cwd()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export type TriggerHandler = () => void

let registeredTriggers: TriggerHandler[] = []
const triggerReloads = () => {
    const reloads = registeredTriggers
    registeredTriggers = []
    for (const triggerReloadFunc of reloads) {
        triggerReloadFunc()
    }
}

const packageJson = JSON.parse(
    await afs.readFile(__dirname + "/../package.json", "utf-8"),
)

program
    .name(packageJson.name)
    .description(packageJson.description)
    .version(packageJson.version)
    .addOption(
        new Option(
            "-p, --port <number>",
            "hot reload server port",
        )
            .argParser(value => Number(value))
            .default(8080)
            .env("HOTWEBY_PORT"),
    )
    .addOption(
        new Option(
            "-d, --dir <string>",
            "Directory to serve html and other static files from.",
        )
            .default(".")
            .env("HOTWEBY_PATH"),
    )
    .addOption(
        new Option(
            "-a, --auto-extension",
            "Try to auto default missing request file extensions. Checks if the requested dir containing a filename starting with requested name + '.'",
        )
            .default(false)
            .env("HOTWEBY_AUTO_EXTENSION"),
    )
    .addOption(
        new Option("-v, --verbose", "Enables verbose logging.")
            .default(false)
            .env("HOTWEBY_VERBOSE"),
    )
    .action(async (str, options) => {
        str.dir = path.normalize(
            !str.dir.startsWith("/")
                ? executrionDir + "/" + str.dir
                : str.dir,
        )

        console.info("Settings: ", str)

        const reloadHtmlCode = createReloadHtmlCode()

        const autoExtension = Boolean(
            str.autoExtension ?? false,
        )

        const verbose = Boolean(str.verbose ?? false)

        if (verbose) {
            console.info("Verbose mode is enabled.")
        }

        console.info(
            "Auto extension resolution is " +
                (autoExtension ? "ON" : "OFF") +
                ".",
        )

        try {
            const stat = await afs.stat(str.dir)

            if (!stat.isDirectory()) {
                throw new Error(
                    "'" + str.dir + "' is not a directory!",
                )
            }
        } catch (err: any) {
            if (err.code === "ENOENT") {
                console.error(
                    "Directory '" + str.dir + "' not exists!",
                )
            }
        }

        const app = createExpress(
            str.dir,
            reloadHtmlCode,
            autoExtension,
            verbose,
        )

        const httpServer = app.listen(
            str.port,
            "0.0.0.0",
            async () => {
                console.info(
                    "Hot-HTML server is running on port '" +
                        str.port +
                        "'",
                )
            },
        )

        createWebSocketServer(httpServer, triggerFunc =>
            registeredTriggers.push(triggerFunc),
        )

        const dirWatcher = afs.watch(str.dir)
        console.info(
            "Wait for file in '" + str.dir + "' changes...",
        )

        for await (const x of dirWatcher) {
            console.info("Hot-HTML trigger reload...")
            triggerReloads()
        }
    })

program.parse()
