import { Router } from "express";
import path from "path";
import qrcode from "qrcode";
import { renderToString } from "react-dom/server";
import { OauthClient } from "../clients/google/OauthClient.ts";
import { WhatsAppClient } from "../clients/WhatsApp.ts";
import Home from "../frontend/pages/Home.tsx";
import Login from "../frontend/pages/Login.tsx";
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
    const qrCodeText = await WhatsAppClient.getInstance().waitForQRCode();
    const qrCode = await qrcode.toDataURL(qrCodeText, {
        type: "png",
    });
    if (!qrCode) {
        res.status(500).send("Failed to generate QR code");
        return;
    }
    const html = await renderToString(<WhatsAppAuth qrCode={qrCode} />);
    res.setHeader("Content-Type", "text/html");
    res.send(html);
});

export default frontendRouter;
