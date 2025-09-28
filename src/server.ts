import express from "express"
import * as afs from "fs/promises"
import { IncomingMessage, Server, ServerResponse } from "http"
import * as path from "path"
import { WebSocket, WebSocketServer } from "ws"

export function createReloadHtmlCode(idEndpoint: string) {
    const location: any = undefined as any
    const window: any = undefined as any

    const reloadHtmlScript = async () => {
        console.log("@noblemajo/serve connect websocket...")

        const err = await new Promise<any>(res => {
            try {
                const wsUrl =
                    (window.location.protocol === "https:"
                        ? "wss://"
                        : "ws://") + window.location.host

                const ws = new WebSocket(wsUrl)
                ws.onopen = () =>
                    console.log(
                        "@noblemajo/serve websocket connected",
                    )
                ws.onclose = () => res(undefined)
                ws.onerror = err => res(err)
            } catch (err) {
                res(err)
            }
        })

        if (err == undefined) {
            location.reload()
        }

        console.log(
            "@noblemajo/serve websocket error:\n",
            err,
            "\n\nFallback to fetch...",
        )

        let resp = await fetch(".${ENDPOINT_ID}")
        let body = await resp.text()
        const initialId = Number(body)
        if (isNaN(initialId)) {
            return console.log(
                "@noblemajo/serve id is not a number",
            )
        }

        console.log("@noblemajo/serve initial id: " + initialId)

        while (true) {
            try {
                resp = await fetch(".${ENDPOINT_ID}")
                body = await resp.text()
                const newId = Number(body)

                if (initialId !== newId) {
                    location.reload()
                }

                await new Promise<void>(res =>
                    setTimeout(res, 800),
                )
            } catch (err) {
                console.log(
                    "Error in @noblemajo/serve loop:\n",
                    err,
                )
            }
        }
    }

    const reloadHtmlCode = ("" + reloadHtmlScript)
        .split("${ENDPOINT_ID}")
        .join(idEndpoint)

    return "<script>\n(" + reloadHtmlCode + ")()\n</script>"
}

export function createExpress(
    targetDir: string,
    reloadHtmlCode: string,
    idEndpoint: string,
    autoExtensionResolution: boolean,
    getReloadId: () => number,
) {
    const app = express()

    app.get(idEndpoint, (req, res) => {
        res.status(200)
        res.send("" + getReloadId())
    })

    app.use(async (req, res, next) => {
        let reqPath = req.path
        if (
            reqPath.endsWith(".html") ||
            reqPath.endsWith("/")
        ) {
            if (reqPath.endsWith("/")) {
                reqPath += "index.html"
            }

            try {
                const data = await afs.readFile(
                    targetDir + reqPath,
                    "utf8",
                )
                res.status(200)
                res.send(reloadHtmlCode + data.toString())
            } catch (err) {
                res.status(400)
                res.send(
                    "Cant read html-file from '" + path + "'",
                )
            }

            return
        }

        if (autoExtensionResolution) {
            let realPath = targetDir + "/" + req.url
            if ((await pathType(realPath)) === "none") {
                const files = await afs.readdir(
                    path.dirname(realPath),
                )

                const baseName = path.basename(realPath)
                for (const file of files) {
                    if (file.startsWith(baseName + ".")) {
                        req.url =
                            path.dirname(req.url) + "/" + file
                        break
                    }
                }
            }
        }

        next()
    })

    app.use(express.static(targetDir))

    return app
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
    addTriggerFunction: (triggerFunction: () => void) => void,
) {
    const wsServer = new WebSocketServer({ noServer: true })
    wsServer.on("connection", (ws, req) => {
        addTriggerFunction(() => {
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
