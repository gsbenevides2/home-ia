import { Router } from "express";
import { renderToString } from "react-dom/server";
import Home from "../frontend/pages/Home.tsx";
import Snapshot from "../frontend/pages/Snapshot.tsx";

const frontendRouter = Router();

export const frontEndRoutes = ["/", "/snapshot", "/css/tailwind.css"];

frontendRouter.get("/", async (req, res) => {
    const html = await renderToString(<Home />);
    res.setHeader("Content-Type", "text/html");
    res.send(html);
});

frontendRouter.get("/snapshot", async (req, res) => {
    const html = await renderToString(<Snapshot />);
    res.setHeader("Content-Type", "text/html");
    res.send(html);
});

frontendRouter.get("/css/tailwind.css", async (req, res) => {
    const css = await Bun.file("public/css/tailwind.css").text();
    res.setHeader("Content-Type", "text/css");
    res.send(css);
});

export default frontendRouter;
