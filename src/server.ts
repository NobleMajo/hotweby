import express from "express"
import * as afs from "fs/promises"
import { IncomingMessage, Server, ServerResponse } from "http"
import * as path from "path"
import { WebSocket, WebSocketServer } from "ws"
import { TriggerHandler } from "./index.js"

export function createReloadHtmlCode() {
    const location: any = undefined as any
    const window: any = undefined as any

    const reloadHtmlScript = async () => {
        console.log("[HOTWEBY]: connect websocket...")
        const loc =
            location && typeof location.reload == "function"
                ? location
                : window.location

        const connectWs = () => {
            const wsUrl =
                (loc.protocol === "https:"
                    ? "wss://"
                    : "ws://") + loc.host

            const ws = new WebSocket(wsUrl)
            ws.onopen = () =>
                console.log("[HOTWEBY]: websocket connected")
            ws.onclose = () => {
                console.log(
                    "[HOTWEBY]: websocket closed, reloading...",
                )
                setTimeout(() => loc.reload(), 100)
            }
            ws.onerror = err => {
                console.error(
                    "[HOTWEBY]: websocket error, reloading...",
                    err,
                )
                setTimeout(() => loc.reload(), 1000)
            }
        }

        connectWs()
    }

    const reloadHtmlCode = "" + reloadHtmlScript

    return "<script>\n(" + reloadHtmlCode + ")()\n</script>"
}

export function createExpress(
    targetDir: string,
    reloadHtmlCode: string,
    autoExtensionResolution: boolean,
) {
    const app = express()

    app.use(async (req, res, next) => {
        if (
            !req.path.endsWith(".html") &&
            !req.path.endsWith("/")
        ) {
            return next()
        }

        let reqPath = req.path

        if (reqPath.endsWith("/")) {
            reqPath += "index.html"
        }

        try {
            const data = await afs.readFile(
                targetDir + reqPath,
                "utf8",
            )
            res.status(200)
            res.send(reloadHtmlCode + "\n" + data.toString())
        } catch (err) {
            console.error(
                "Cant read requested html-file '" +
                    req.path +
                    "'" +
                    "\nfrom '" +
                    targetDir +
                    reqPath +
                    "':\n",
                err,
            )
            res.status(503)
            res.setHeader("Content-Type", "text/plain")
            res.setHeader("Retry-After", "5")
            res.send(
                "Cant read requested html-file '" +
                    req.path +
                    "'",
            )
        }
    })

    autoExtensionResolution &&
        app.use(async (req, res, next) => {
            const resolvedExtension =
                await autoResolveExtensions(req.url, targetDir)

            if (resolvedExtension) {
                req.url = resolvedExtension
            }

            next()
        })

    app.use(express.static(targetDir))

    return app
}

export async function autoResolveExtensions(
    reqUrl: string,
    targetDir: string,
): Promise<string | undefined> {
    while (reqUrl.startsWith("/")) {
        reqUrl = reqUrl.slice(1)
    }

    if (reqUrl === "") {
        return undefined
    }

    let realPath = targetDir + "/" + reqUrl
    if ((await pathType(realPath)) === "none") {
        const files = await afs.readdir(path.dirname(realPath))

        const baseName = path.basename(realPath)
        for (const file of files) {
            if (file.startsWith(baseName + ".")) {
                return
            }
        }
    }
}

export async function pathType(
    path: string,
): Promise<"file" | "dir" | "none"> {
    try {
        const stat = await afs.stat(path)
        return stat.isFile() ? "file" : "dir"
    } catch {}
    return "none"
}

export function createWebSocketServer(
    httpServer: Server<
        typeof IncomingMessage,
        typeof ServerResponse
    >,
    registerTrigger: (triggerHandler: TriggerHandler) => void,
) {
    const wsServer = new WebSocketServer({ noServer: true })
    wsServer.on("connection", (ws, req) => {
        registerTrigger(() => {
            if (
                ws.readyState === ws.OPEN ||
                ws.readyState === ws.CONNECTING
            ) {
                ws.close()
            }
        })
    })

    httpServer.on("upgrade", (req, socket, head) => {
        wsServer.handleUpgrade(req, socket, head, ws => {
            wsServer.emit("connection", ws, req)
        })
    })

    return wsServer
}
