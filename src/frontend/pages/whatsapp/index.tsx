import type { Treaty } from "@elysiajs/eden";
import { useEffect, useRef, useState } from "react";
import { client } from "../../client";
import Loading from "../loading";
import QrCode from "./components/QrCode";
import SuccessWhatsApp from "./components/Success";

type SuccessState = {
    state: "success";
};

type AwaitingAuthenticationState = {
    state: "awaiting-authentication";
};

type InitState = {
    state: "init";
};

type ConnectedState = {
    state: "connected";
};

type QrCodeState = {
    state: "qr-code";
    qrCode: string;
};

type Props =
    | SuccessState
    | AwaitingAuthenticationState
    | QrCodeState
    | InitState
    | ConnectedState;

type Message = Treaty.OnMessage<{
    data: string;
    type: "qr-code" | "success";
}>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventMessageListener = (this: WebSocket, ev: MessageEvent<any>) => void;

export default function WhatsAppPage() {
    const [state, setState] = useState<Props>({
        state: "init",
    });
    const ws = useRef(client.whatsapp.subscribe());
    useEffect(() => {
        const eventOpenListener = () => {
            setState({
                state: "connected",
            });
        };
        const eventMessageListener = (message: Message) => {
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
        };
        ws.current.addEventListener("open", eventOpenListener);
        ws.current.addEventListener("message", eventMessageListener);
        return () => {
            ws.current.removeEventListener("open", eventOpenListener);
            ws.current.removeEventListener(
                "message",
                eventMessageListener as EventMessageListener,
            );
        };
    }, []);

    useEffect(() => {
        if (state.state === "connected") {
            ws.current.send({
                type: "start-connection",
            });
        }
    }, [state.state]);

    if (state.state === "success") {
        return <SuccessWhatsApp />;
    }

    if (state.state === "qr-code") {
        return <QrCode qrCode={state.qrCode} />;
    }

    return <Loading />;
}
