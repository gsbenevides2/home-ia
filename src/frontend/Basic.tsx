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
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" />
                <link rel="preconnect" href="https://unpkg.com" />
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
                />
                <link
                    href="https://unpkg.com/material-components-web@latest/dist/material-components-web.min.css"
                    rel="stylesheet"
                />
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/icon?family=Material+Icons"
                >
                </link>
                <link rel="stylesheet" href="/css/material-icons.css" />
                <link rel="stylesheet" href="/css/tailwind.css" />

                <script src="https://unpkg.com/material-components-web@latest/dist/material-components-web.min.js">
                </script>
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
