#!/usr/bin/env node

import { Option, program } from "commander"
import * as afs from "fs/promises"
import * as path from "path"
import { fileURLToPath } from "url"
import { createExpress, createWebSocketServer } from "./server.js"

const location: any = undefined as any

const func = (async () => {
    const resp = await fetch("./hot-html-id")

    const body = await resp.text()
    const id = Number(body)
    if (isNaN(id)) {
        return console.error("API-ID is not a number")
    }

    console.info("Current API-ID " + id)

    setInterval(async () => {
        const resp = await fetch("./id")
        const body = await resp.text()
        const id2 = Number(body)
        if (isNaN(id2)) {
            return console.error("API-ID is not a number")
        }

        if (id !== id2) {
            location.reload()
        }
    }, 200)
})

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
const reloadHtmlCode = "<script>\n" + func + "()\n</script>"

const packageJson = JSON.parse(
    await afs.readFile(
        __dirname + "/package.json",
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
            .argParser(
                (value) => Number(value)
            )
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
        console.log("str: ", str)

        if (!str.idEndpoint.startsWith("/")) {
            str.idEndpoint = "/" + str.idEndpoint
        }

        const targetDir = (
            !str.dir.startsWith("/") ?
                path.normalize(executrionDir + "/" + str.dir) :
                str.dir
        )

        const stat = await afs.stat(targetDir)

        if (!stat.isDirectory()) {
            throw new Error("'" + targetDir + "' is not a directory!")
        }

        const app = createExpress(
            targetDir,
            reloadHtmlCode,
            getReloadId,
        )

        const httpServer = app.listen(str.port, "0.0.0.0", async () => {
            console.info("Hot-HTML server is running on port '" + str.port + "'")
        })

        const wsServer = createWebSocketServer(
            httpServer,
            (triggerFunc) => triggerReloadFuncs.push(triggerFunc)
        )

        const dirWatcher = afs.watch(
            targetDir,
            "utf8"
        )

        for await (const x of dirWatcher) {
            console.info("Hot-HTML trigger reload...")
            triggerReloads()
        }
    })

program.parse()



