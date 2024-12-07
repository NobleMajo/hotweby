#!/usr/bin/env node

import { Option, program } from "commander"
import * as afs from "fs/promises"
import * as path from "path"
import { fileURLToPath } from "url"
import { createExpress, createReloadHtmlCode, createWebSocketServer } from "./server.js"

const executrionDir = process.cwd()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let reloadId: number = 0
const getReloadId = () => reloadId

let triggerReloadFuncs: (() => void)[] = []
const triggerReloads = () => {
    reloadId++
    const reloads = triggerReloadFuncs
    triggerReloadFuncs = []
    for (const triggerReloadFunc of reloads) {
        triggerReloadFunc()
    }
}

const packageJson = JSON.parse(
    await afs.readFile(
        __dirname + "/../package.json",
        "utf-8"
    )
)

program
    .name(packageJson.name)
    .description(packageJson.description)
    .version(packageJson.version)
    .addOption(
        new Option(
            "-p, --port <number>",
            "hot reload server port"
        )
            .makeOptionMandatory()
            .argParser(
                (value) => Number(value)
            )
            .env("SERVE_PORT")
    )
    .addOption(
        new Option(
            "-d, --dir <string>",
            "target dir"
        )
            .default(".")
            .env("SERVE_PATH")
    )
    .addOption(
        new Option(
            "-i, --id-endpoint <string>",
            "id endpoint"
        )
            .default("/noblemajo-serve-id")
            .env("SERVE_ID_ENDPOINT")
    )
    .action(async (str, options) => {
        if (!str.idEndpoint.startsWith("/")) {
            str.idEndpoint = "/" + str.idEndpoint
        }

        str.dir = path.normalize(
            !str.dir.startsWith("/") ?
                executrionDir + "/" + str.dir :
                str.dir
        )

        console.info("Settings: ", str)

        const reloadHtmlCode = createReloadHtmlCode(
            str.idEndpoint
        )

        try {
            const stat = await afs.stat(str.dir)

            if (!stat.isDirectory()) {
                throw new Error("'" + str.dir + "' is not a directory!")
            }
        } catch (err: any) {
            if (err.code === "ENOENT") {
                console.error("Directory '" + str.dir + "' not exists!")
            }
        }

        const app = createExpress(
            str.dir,
            reloadHtmlCode,
            str.idEndpoint,
            getReloadId,
        )

        const httpServer = app.listen(str.port, "0.0.0.0", async () => {
            console.info("Hot-HTML server is running on port '" + str.port + "'")
        })

        createWebSocketServer(
            httpServer,
            (triggerFunc) => triggerReloadFuncs.push(triggerFunc)
        )

        const dirWatcher = afs.watch(str.dir)
        console.info("Wait for file in '" + str.dir + "' changes...")

        for await (const x of dirWatcher) {
            console.info("Hot-HTML trigger reload...")
            triggerReloads()
        }
    })

program.parse()



