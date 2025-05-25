import { useScriptAsDataURI } from "../utils/useScript";

interface BasicProps {
    children: React.ReactNode;
}

export default function Basic(props: BasicProps) {
    return (
        <html lang="pt-br">
            <head>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                />
                <meta name="description" content="Home GCP" />
                <meta name="author" content="Home GCP" />
                <title>Home GCP</title>
                <link rel="stylesheet" href="/css/mdc.css" />
                <link rel="stylesheet" href="/css/roboto.css" />
                <link rel="stylesheet" href="/css/material-icons.css" />
                <link rel="stylesheet" href="/css/tailwind.css" />
                <link rel="stylesheet" href="/css/video-js.css" />
                <script src="/js/material-components-web.min.js" />
                <script src="/js/htmx.js" />
                <script src="/js/video.min.js" />
            </head>
            <body className="mdc-typography">{props.children}</body>
            <script
                src={useScriptAsDataURI(() => {
                    window.mdc.autoInit();
                })}
            />
        </html>
    );
}
