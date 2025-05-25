import { useId } from "react";
import { useScript, useScriptAsDataURI } from "../../utils/useScript";

interface CameraCardProps {
    cameraId: string;
    cameraName: string;
}

export default function CameraCard(props: CameraCardProps) {
    const { cameraId, cameraName } = props;
    const containerId = useId();
    const initStream = useScriptAsDataURI(
        async (containerId: string, cameraId: string) => {
            const container = document.getElementById(
                containerId,
            ) as HTMLDivElement;
            if (!container) {
                console.error("Container não encontrado");
                return;
            }

            // Aguardar o carregamento do Video.js
            if (!window.videojs) {
                console.error("Video.js não está disponível");
                return;
            }

            const videoElement = container.querySelector("video");
            if (!videoElement) {
                console.error("Video não encontrado");
                return;
            }
            // Configurar o player Video.js
            const player = window.videojs(videoElement, {
                controls: false,
                autoplay: true,
                preload: "auto",
                muted: true,
                poster: `/cameras-service/${cameraId}/snapshot.jpg`,
                loop: true,
                fluid: false,
                fill: false,
                responsive: true,
                class: "rounded-2xl",
                aspectRatio: "16:9",
                html5: {
                    vhs: {
                        overrideNative: true,
                        limitRenditionByPlayerDimensions: true,
                        smoothQualityChange: true,
                        lowLatencyMode: true,
                        bufferSize: 3,
                        liveSyncDuration: 0.5,
                        liveMaxLatencyDuration: 1.0,
                    },
                },
            });

            // Função para obter a URL do stream
            const getLiveStreamUrl = () => {
                const timestamp = Date.now();
                return `/cameras-service/${cameraId}/playlist.m3u8?_t=${timestamp}`;
            };

            // Definir fonte HLS
            player.src({
                src: getLiveStreamUrl(),
                type: "application/x-mpegURL",
                withCredentials: false,
            });

            // Configurar eventos básicos
            player.on("error", () => {
                // Em caso de erro, voltar para o poster
                player.poster(
                    `/cameras-service/${cameraId}/snapshot.jpg?_t=${Date.now()}`,
                );
            });

            // Atualizar stream periodicamente
            const refreshInterval = setInterval(() => {
                if (!player.paused()) {
                    player.src({
                        src: getLiveStreamUrl(),
                        type: "application/x-mpegURL",
                    });
                }
            }, 60000); // Atualizar a cada 60 segundos

            // Limpar recursos ao desmontar
            return () => {
                if (player) {
                    player.dispose();
                }
                clearInterval(refreshInterval);
            };
        },
        containerId,
        cameraId,
    );
    const unmute = useScript((containerId: string) => {
        const container = document.getElementById(
            containerId,
        ) as HTMLDivElement;
        if (!container) {
            console.error("Container não encontrado");
            return;
        }
        const videoElement = container.querySelector(
            "video",
        ) as HTMLVideoElement;
        if (!videoElement) {
            console.error("Video não encontrado");
            return;
        }
        const unMuteButton = container.querySelector(
            "#unMuteButton",
        ) as HTMLButtonElement;
        if (!unMuteButton) {
            console.error("Botão de desmutar não encontrado");
            return;
        }
        if (videoElement.muted) {
            videoElement.muted = false;
            unMuteButton.textContent = "volume_up";
        } else {
            videoElement.muted = true;
            unMuteButton.textContent = "volume_off";
        }
    }, containerId);

    const clickToFullScreen = useScript((containerId: string) => {
        const container = document.getElementById(
            containerId,
        ) as HTMLDivElement;
        if (!container) {
            console.error("Container não encontrado");
        }
        container.requestFullscreen();
    }, containerId);

    return (
        <div
            className="flex relative cursor-pointer"
            id={containerId}
            hx-on:click={clickToFullScreen}
        >
            <video
                className="w-full relative rounded-2xl aspect-video video-js"
                poster={`/cameras-service/${cameraId}/snapshot.jpg`}
                muted
                playsInline
                id="player"
            />
            <div className="absolute bottom-0 left-0 w-full bg-black/50 p-2 flex justify-between">
                <div>
                    <p className="mdc-typography--body1">
                        {cameraName}
                    </p>
                    <p className="mdc-typography--body2">
                        Ao vivo
                    </p>
                </div>
                <div className="flex items-center">
                    <button
                        className="mdc-icon-button material-icons mx-1"
                        title="Ativar/desativar som"
                        id="unMuteButton"
                        hx-on:click={unmute}
                    >
                        volume_off
                    </button>
                    <button
                        className="mdc-icon-button material-icons mx-1"
                        title="Mover para cima"
                    >
                        arrow_upward
                    </button>
                    <button
                        className="mdc-icon-button material-icons mx-1"
                        title="Mover para baixo"
                    >
                        arrow_downward
                    </button>
                    <button
                        className="mdc-icon-button material-icons mx-1"
                        title="Mover para esquerda"
                    >
                        arrow_back
                    </button>
                    <button
                        className="mdc-icon-button material-icons mx-1"
                        title="Mover para direita"
                    >
                        arrow_forward
                    </button>
                </div>
            </div>
            <script src={initStream} />
        </div>
    );
}
