import { Router } from "express";
import path from "path";
import qrcode from "qrcode";
import { renderToString } from "react-dom/server";
import { SavedPromptDatabase } from "../clients/database/savedPrompts.ts";
import { OauthClient } from "../clients/google/OauthClient.ts";
import { WhatsAppClient } from "../clients/WhatsApp.ts";
import Home from "../frontend/pages/Home.tsx";
import Login from "../frontend/pages/Login.tsx";
import SavedPrompts from "../frontend/pages/SavedPrompts.tsx";
import WhatsAppAuth from "../frontend/pages/WhatsAppAuth.tsx";

const frontendRouter = Router();
const oauthClient = OauthClient.getInstance();

const cameraList = ["rua"];

frontendRouter.get("/", async (req, res) => {
    const html = await renderToString(
        <Home
            cameraList={cameraList}
            googleLoginUrl={oauthClient.staterUrl.pathname}
        />,
    );
    res.setHeader("Content-Type", "text/html");
    res.send(html);
});

frontendRouter.get("/css/:file", async (req, res) => {
    const css = await Bun.file(`public/css/${req.params.file}`).text();
    res.setHeader("Content-Type", "text/css");
    res.send(css);
});

frontendRouter.get("/fonts/:file", async (req, res) => {
    const filePath = path.join(
        process.cwd(),
        "public",
        "fonts",
        req.params.file,
    );
    res.sendFile(filePath);
});

frontendRouter.get("/js/:file", async (req, res) => {
    const js = await Bun.file(`public/js/${req.params.file}`).text();
    res.setHeader("Content-Type", "text/javascript");
    res.send(js);
});

frontendRouter.get("/login", async (req, res) => {
    const error = req.query.error === "true";
    const html = await renderToString(<Login error={error} />);
    res.setHeader("Content-Type", "text/html");
    res.send(html);
});

frontendRouter.get("/whatsapp-auth", async (req, res) => {
    const wathsAppInstance = await WhatsAppClient.getInstance();
    const connectResult = await wathsAppInstance.connect();
    let isClosed = false;
    req.on("close", () => {
        if (!isClosed) {
            wathsAppInstance.release();
            isClosed = true;
        }
    });

    if (connectResult === "awaitingForAuthentication") {
        const qrCodeText = await wathsAppInstance.waitForQRCode();
        const qrCode = await qrcode.toDataURL(qrCodeText, {
            type: "image/png",
        });
        if (!qrCode) {
            res.status(500).send("Failed to generate QR code");
            return;
        }

        const html = await renderToString(<WhatsAppAuth qrCode={qrCode} />);
        res.setHeader("Content-Type", "text/html");
        res.send(html);
        isClosed = true;
        return;
    }

    wathsAppInstance.release();

    const html = await renderToString(<WhatsAppAuth authenticated />);
    res.setHeader("Content-Type", "text/html");
    res.send(html);
    isClosed = true;
});

frontendRouter.get("/whatsapp-auth/finish", async (req, res) => {
    WhatsAppClient.forceCurrentInstanceRelease();
    res.redirect("/");
});

frontendRouter.get("/saved-prompts", async (req, res) => {
    const prompts = await SavedPromptDatabase.getInstance().getSavedPrompts();
    const html = await renderToString(<SavedPrompts prompts={prompts} />);
    res.setHeader("Content-Type", "text/html");
    res.send(html);
});

export default frontendRouter;
