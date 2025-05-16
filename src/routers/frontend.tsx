import { Router } from "express";
import { renderToString } from "react-dom/server";
import { OauthClient } from "../clients/google/OauthClient.ts";
import CameraPage from "../frontend/pages/CameraPage.tsx";
import Home from "../frontend/pages/Home.tsx";
import Login from "../frontend/pages/Login.tsx";
import Snapshot from "../frontend/pages/Snapshot.tsx";

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

frontendRouter.get("/camera/:camera", async (req, res) => {
    if (!cameraList.includes(req.params.camera)) {
        return res.status(404).send("Camera not found");
    }
    const html = await renderToString(
        <CameraPage camera={req.params.camera} />,
    );
    res.setHeader("Content-Type", "text/html");
    res.send(html);
});

frontendRouter.get("/camera/:camera/snapshot", async (req, res) => {
    if (!cameraList.includes(req.params.camera)) {
        return res.status(404).send("Camera not found");
    }
    const html = await renderToString(<Snapshot camera={req.params.camera} />);
    res.setHeader("Content-Type", "text/html");
    res.send(html);
});

frontendRouter.get("/css/tailwind.css", async (req, res) => {
    const css = await Bun.file("public/css/tailwind.css").text();
    res.setHeader("Content-Type", "text/css");
    res.send(css);
});

frontendRouter.get("/login", async (req, res) => {
    const error = req.query.error === "true";
    const html = await renderToString(<Login error={error} />);
    res.setHeader("Content-Type", "text/html");
    res.send(html);
});

export default frontendRouter;
