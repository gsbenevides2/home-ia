import { IconButton } from "@rmwc/icon-button";
import { Typography } from "@rmwc/typography";
import { useCallback, useEffect, useRef, useState } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { client } from "../../../../client";
import styles from "./styles.module.css";

interface CameraCardProps {
    cameraId: string;
    cameraName: string;
}

export default function CameraCard(props: CameraCardProps) {
    const { cameraId, cameraName } = props;
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isMuted, setIsMuted] = useState(true);

    const toogleMuted = useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            event.preventDefault();
            event.stopPropagation();
            const videoElement = videoRef.current;
            if (!videoElement) {
                return;
            }
            videoElement.muted = !isMuted;
            setIsMuted(!isMuted);
        },
        [isMuted],
    );

    const moveUp = useCallback(
        async (event: React.MouseEvent<HTMLButtonElement>) => {
            event.preventDefault();
            event.stopPropagation();
            await client["cameras-service"]({
                cameraName: cameraId,
            }).up.post();
        },
        [cameraId],
    );

    const moveDown = useCallback(
        async (event: React.MouseEvent<HTMLButtonElement>) => {
            event.preventDefault();
            event.stopPropagation();
            await client["cameras-service"]({
                cameraName: cameraId,
            }).down.post();
        },
        [cameraId],
    );

    const moveLeft = useCallback(
        async (event: React.MouseEvent<HTMLButtonElement>) => {
            event.preventDefault();
            event.stopPropagation();
            await client["cameras-service"]({
                cameraName: cameraId,
            }).left.post();
        },
        [cameraId],
    );

    const moveRight = useCallback(
        async (event: React.MouseEvent<HTMLButtonElement>) => {
            event.preventDefault();
            event.stopPropagation();
            await client["cameras-service"]({
                cameraName: cameraId,
            }).right.post();
        },
        [cameraId],
    );

    const fullScreen = useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            event.preventDefault();
            event.stopPropagation();
            const videoElement = videoRef.current;
            if (!videoElement) {
                return;
            }
            videoElement.requestFullscreen();
        },
        [],
    );

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) {
            return;
        }
        // Configurar o player Video.js
        const player = videojs(videoElement, {
            controls: false,
            autoplay: true,
            preload: "auto",
            muted: true,
            poster: `/cameras-service/${cameraId}/snapshot.jpg`,
            loop: true,
            fluid: false,
            fill: false,
            responsive: true,
            class: styles.videoInternal,
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
        return () => {
            clearInterval(refreshInterval);
        };
    }, []);

    return (
        <div
            className={styles.card}
            onClick={fullScreen}
        >
            <video
                className={styles.video}
                poster={`/cameras-service/${cameraId}/snapshot.jpg`}
                muted
                playsInline
                ref={videoRef}
            />
            <div className={styles.bar}>
                <div>
                    <Typography use="body1">{cameraName}</Typography>
                    <Typography use="body2">Ao vivo</Typography>
                </div>
                <div className={styles.buttons}>
                    <IconButton
                        className={styles.button}
                        icon={isMuted ? "volume_off" : "volume_up"}
                        title="Ativar/desativar som"
                        id="unMuteButton"
                        onClick={toogleMuted}
                    />
                    <IconButton
                        className={styles.button}
                        icon="arrow_upward"
                        title="Mover para cima"
                        onClick={moveUp}
                    />
                    <IconButton
                        className={styles.button}
                        icon="arrow_downward"
                        title="Mover para baixo"
                        onClick={moveDown}
                    />
                    <IconButton
                        className={styles.button}
                        icon="arrow_back"
                        title="Mover para esquerda"
                        onClick={moveLeft}
                    />
                    <IconButton
                        className={styles.button}
                        icon="arrow_forward"
                        title="Mover para direita"
                        onClick={moveRight}
                    />
                </div>
            </div>
            {/* <script src={initStream} /> */}
        </div>
    );
}
