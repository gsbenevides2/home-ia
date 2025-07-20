import { useCallback, useEffect, useRef, useState } from "react";
import { client } from "../../client";
import Loading from "../loading";
import QrCode from "./QrCode";
import SuccessWhatsApp from "./Success";

type SuccessState = {
    state: "success";
};

type AwaitingAuthenticationState = {
    state: "awaiting-authentication";
};

type QrCodeState = {
    state: "qr-code";
    qrCode: string;
};

type Props = SuccessState | AwaitingAuthenticationState | QrCodeState;

export default function WhatsAppPage() {
    const [state, setState] = useState<Props>({
        state: "awaiting-authentication",
    });
    const ws = useRef(client.whatsapp.subscribe());
    const isFirstTime = useRef(true);

    const prepare = useCallback(() => {
        if (isFirstTime.current) {
            isFirstTime.current = false;
            return;
        }

        ws.current.subscribe((message) => {
            console.log("message", message);
            if (message.data.type === "qr-code") {
                setState({
                    state: "qr-code",
                    qrCode: message.data.data,
                });
            } else if (message.data.type === "success") {
                setState({
                    state: "success",
                });
            }
        });
        ws.current.on("open", () => {
            console.log("open");
            if (!ws.current) {
                return;
            }
            ws.current.send({
                type: "start-connection",
            });
        });
    }, []);

    useEffect(() => {
        prepare();
    }, []);

    if (state.state === "success") {
        return <SuccessWhatsApp />;
    }

    if (state.state === "qr-code") {
        return <QrCode qrCode={state.qrCode} />;
    }

    return <Loading />;
}
