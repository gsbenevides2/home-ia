import { useScriptAsDataURI } from "../../utils/useScript";
import Basic from "../Basic";

const loadPage = async () => {
    // Player simplificado usando Video.js para HLS
    const initPlayer = async () => {
        // Aguardar o carregamento do Video.js
        if (!window.videojs) {
            console.error("Video.js não está disponível");
            return;
        }

        const videoElement = document.getElementById(
            "videoPlayer",
        ) as HTMLVideoElement;

        // Log status
        const statusElement = document.createElement("div");
        statusElement.style.position = "absolute";
        statusElement.style.bottom = "10px";
        statusElement.style.left = "10px";
        statusElement.style.color = "white";
        statusElement.style.backgroundColor = "rgba(0,0,0,0.5)";
        statusElement.style.padding = "5px";
        statusElement.style.zIndex = "1000";
        document.querySelector("#videoPlayer")?.parentElement?.appendChild(
            statusElement,
        );

        const log = (message: string) => {
            console.log(message);
            statusElement.textContent = message;
        };

        // Container de fallback para imagem
        const fallbackContainer = document.createElement("div");
        fallbackContainer.style.display = "none";
        fallbackContainer.style.position = "absolute";
        fallbackContainer.style.top = "0";
        fallbackContainer.style.left = "0";
        fallbackContainer.style.width = "100%";
        fallbackContainer.style.height = "100%";
        fallbackContainer.style.backgroundColor = "black";
        fallbackContainer.style.zIndex = "500";
        document.querySelector("#videoPlayer")?.parentElement?.appendChild(
            fallbackContainer,
        );

        const fallbackImg = document.createElement("img");
        fallbackImg.style.width = "100%";
        fallbackImg.style.height = "100%";
        fallbackImg.style.objectFit = "contain";
        fallbackContainer.appendChild(fallbackImg);

        // Função para mostrar o snapshot
        const showSnapshot = () => {
            fallbackImg.src = `/cameras/rua/snapshot.jpg?_t=${Date.now()}`;
            fallbackContainer.style.display = "block";
            log("Exibindo snapshot estático (imagem atualizada)");
        };

        // Função para esconder o snapshot e voltar ao stream
        const hideSnapshot = () => {
            fallbackContainer.style.display = "none";
        };

        log("Inicializando player...");

        // Configurar o player Video.js
        const player = window.videojs(videoElement, {
            controls: true,
            autoplay: true,
            preload: "auto",
            fluid: true,
            liveui: true,
            liveTracker: {
                trackingThreshold: 1.0, // Quanto tempo atrás para considerar "ao vivo"
                liveTolerance: 0.5, // Quanto tempo antes do fim considerar "ao vivo"
            },
            html5: {
                vhs: {
                    overrideNative: true,
                    limitRenditionByPlayerDimensions: false,
                    smoothQualityChange: true,
                    bandwidth: 5000000, // 5Mbps
                    liveSyncDurationCount: 2, // Mais segmentos para sincronização
                    liveMaxLatencyDurationCount: 4, // Mais tolerância para latência
                    liveSyncDuration: 0.5, // Sincronizar a cada 0.5 segundos
                    liveMaxLatencyDuration: 1.0, // Latência máxima de 1 segundo
                    lowLatencyMode: true, // Modo de baixa latência
                    bufferSize: 5, // Tamanho do buffer em segundos
                    experimentalBufferBasedABR: true, // ABR experimental
                    appendErrorMaxRetry: 3, // Número máximo de tentativas
                    leastPixelDiffPercent: 25, // Diferença de pixels para considerar alteração
                },
            },
        });

        // Função para obter a URL atual com timestamp para evitar cache
        const getLiveStreamUrl = (forceRefresh = false) => {
            const timestamp = Date.now();
            const refreshParam = forceRefresh ? "&refresh=true" : "";
            return `/cameras/rua/playlist.m3u8?_t=${timestamp}${refreshParam}`;
        };

        // Definir fonte HLS
        player.src({
            src: getLiveStreamUrl(true), // Forçar atualização inicial
            type: "application/x-mpegURL",
            withCredentials: false,
        });

        // Contador de erros
        let errorCount = 0;
        const MAX_ERRORS = 3;

        // Configurar eventos
        player.on("loadstart", () => {
            log("Carregando stream...");
            hideSnapshot();
        });
        player.on(
            "loadeddata",
            () => {
                log("Dados carregados - iniciando reprodução...");
                errorCount = 0;
                hideSnapshot();
            },
        );
        player.on("waiting", () => log("Aguardando mais dados..."));
        player.on("playing", () => {
            log("Reprodução iniciada!");
            errorCount = 0;
            hideSnapshot();
        });
        player.on("error", () => {
            const error = player.error();
            log(`Erro: ${error?.message || "Desconhecido"}`);
            errorCount++;

            if (errorCount >= MAX_ERRORS) {
                log("Muitos erros, alternando para snapshot estático");
                showSnapshot();

                // Tentar o stream ocasionalmente
                setTimeout(() => {
                    log("Tentando voltar ao stream ao vivo...");
                    player.src({
                        src: getLiveStreamUrl(true),
                        type: "application/x-mpegURL",
                    });
                    player.play().catch(() => {
                        // Se falhar novamente, voltamos ao snapshot
                        showSnapshot();
                    });
                }, 30000);
            } else {
                // Tentar novamente automaticamente após erro
                setTimeout(() => {
                    log("Tentando novamente...");
                    player.src({
                        src: getLiveStreamUrl(true),
                        type: "application/x-mpegURL",
                    });
                    player.play().catch(() => {
                        errorCount++;
                    });
                }, 5000);
            }
        });

        // Programar atualização periódica
        const refreshInterval = setInterval(() => {
            if (player.paused()) return; // Não atualizar se estiver pausado
            if (fallbackContainer.style.display !== "none") {
                // Se estamos no modo snapshot, atualizá-lo
                showSnapshot();
                return;
            }

            log("Atualizando stream...");
            player.src({
                src: getLiveStreamUrl(),
                type: "application/x-mpegURL",
            });
            player.play();
        }, 30000); // Atualizar a cada 30 segundos

        // Intervalo específico para snapshot
        const snapshotInterval = setInterval(() => {
            if (fallbackContainer.style.display !== "none") {
                showSnapshot();
            }
        }, 10000); // Atualizar snapshot a cada 10 segundos se visível

        // Botão para forçar reload
        const resetButton = document.createElement("button");
        resetButton.textContent = "Atualizar Agora";
        resetButton.style.position = "absolute";
        resetButton.style.top = "10px";
        resetButton.style.left = "10px";
        resetButton.style.zIndex = "1000";
        resetButton.onclick = () => {
            log("Atualizando stream agora...");
            player.reset();
            player.src({
                src: getLiveStreamUrl(true),
                type: "application/x-mpegURL",
            });
            player.play().catch(() => {
                showSnapshot();
            });
        };
        document.querySelector("#videoPlayer")?.parentElement?.appendChild(
            resetButton,
        );

        // Botão para alternar entre stream e snapshot
        const toggleButton = document.createElement("button");
        toggleButton.textContent = "Alternar Modo";
        toggleButton.style.position = "absolute";
        toggleButton.style.top = "10px";
        toggleButton.style.left = "150px";
        toggleButton.style.zIndex = "1000";
        toggleButton.onclick = () => {
            if (fallbackContainer.style.display === "none") {
                showSnapshot();
                log("Modo: Snapshot Estático");
            } else {
                hideSnapshot();
                log("Modo: Stream ao Vivo");
                player.src({
                    src: getLiveStreamUrl(true),
                    type: "application/x-mpegURL",
                });
                player.play().catch(() => {
                    showSnapshot();
                });
            }
        };
        document.querySelector("#videoPlayer")?.parentElement?.appendChild(
            toggleButton,
        );

        // Botão para desativar/ativar o buffer
        const lowLatencyButton = document.createElement("button");
        lowLatencyButton.textContent = "Modo Ultra-rápido";
        lowLatencyButton.style.position = "absolute";
        lowLatencyButton.style.top = "10px";
        lowLatencyButton.style.right = "10px";
        lowLatencyButton.style.zIndex = "1000";
        lowLatencyButton.style.padding = "5px 10px";
        lowLatencyButton.style.backgroundColor = "#4CAF50";
        lowLatencyButton.style.color = "white";
        lowLatencyButton.style.border = "none";
        lowLatencyButton.style.borderRadius = "4px";
        lowLatencyButton.style.cursor = "pointer";

        let lowLatencyMode = false;

        lowLatencyButton.onclick = () => {
            lowLatencyMode = !lowLatencyMode;
            if (lowLatencyMode) {
                log("Modo de latência ultra-baixa ativado");
                lowLatencyButton.style.backgroundColor = "#f44336";
                lowLatencyButton.textContent = "Modo Qualidade";

                // Configurar para latência mais baixa
                player.tech().vhs.experimentalBufferBasedABR = true;
                player.tech().vhs.bufferSize = 1.5;
                player.tech().vhs.liveSyncDuration = 0.3;
                player.tech().vhs.liveMaxLatencyDuration = 0.6;

                // Reduzir buffer
                if (player.tech().el_.bufferingPolicy) {
                    player.tech().el_.bufferingPolicy({ maxBufferSize: 5 });
                }
            } else {
                log("Modo de melhor qualidade ativado");
                lowLatencyButton.style.backgroundColor = "#4CAF50";
                lowLatencyButton.textContent = "Modo Ultra-rápido";

                // Configurações para melhor qualidade
                player.tech().vhs.experimentalBufferBasedABR = true;
                player.tech().vhs.bufferSize = 10;
                player.tech().vhs.liveSyncDuration = 1.0;
                player.tech().vhs.liveMaxLatencyDuration = 2.0;

                // Aumentar buffer para estabilidade
                if (player.tech().el_.bufferingPolicy) {
                    player.tech().el_.bufferingPolicy({ maxBufferSize: 30 });
                }
            }

            // Recarregar stream
            player.src({
                src: getLiveStreamUrl(true),
                type: "application/x-mpegURL",
                withCredentials: false,
            });
            player.play();
        };

        document.querySelector("#videoPlayer")?.parentElement?.appendChild(
            lowLatencyButton,
        );

        // Limpar recursos ao desmontar
        return () => {
            if (player) {
                player.dispose();
            }
            clearInterval(refreshInterval);
            clearInterval(snapshotInterval);
        };
    };

    // Inicializar quando DOM estiver pronto
    if (document.readyState === "complete") {
        initPlayer();
    } else {
        document.addEventListener("DOMContentLoaded", initPlayer);
    }
};

// Definir a interface para o objeto window com videojs
declare global {
    interface Window {
        videojs: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    }
}

export default function Home() {
    return (
        <Basic>
            <div style={{ maxWidth: "800px", margin: "20px auto" }}>
                <h1 style={{ textAlign: "center" }}>Câmera</h1>
                <div style={{ margin: "10px 0", textAlign: "right" }}>
                    <a
                        href="/snapshot"
                        style={{
                            color: "#007bff",
                            textDecoration: "none",
                        }}
                    >
                        Ver modo estático (baixo consumo) &rarr;
                    </a>
                </div>
                <video
                    id="videoPlayer"
                    className="video-js vjs-default-skin vjs-big-play-centered"
                    controls
                    autoPlay
                    muted
                    playsInline
                    style={{ width: "100%", height: "auto" }}
                    data-setup="{}"
                />
            </div>
            {/* Adicionar Video.js e CSS */}
            <link
                href="https://vjs.zencdn.net/7.20.3/video-js.css"
                rel="stylesheet"
            />
            <script src="https://vjs.zencdn.net/7.20.3/video.min.js"></script>
            <script src={useScriptAsDataURI(loadPage)} />
        </Basic>
    );
}
