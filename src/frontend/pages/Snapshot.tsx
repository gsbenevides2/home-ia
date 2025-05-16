import { useScriptAsDataURI } from "../../utils/useScript";
import Basic from "../Basic";

const loadPage = async () => {
    const initSnapshotViewer = () => {
        const container = document.getElementById("snapshotContainer");
        if (!container) return;

        // Criar imagem
        const img = document.createElement("img");
        img.style.width = "100%";
        img.style.objectFit = "contain";
        img.style.maxHeight = "70vh";
        container.appendChild(img);

        // Criar status
        const statusElement = document.createElement("div");
        statusElement.style.margin = "10px 0";
        statusElement.style.padding = "5px";
        statusElement.style.backgroundColor = "rgba(0,0,0,0.1)";
        statusElement.style.borderRadius = "4px";
        statusElement.style.textAlign = "center";
        container.appendChild(statusElement);

        const log = (message: string) => {
            console.log(message);
            statusElement.textContent = message;
        };

        // Criar container de erro para ser exibido quando a imagem falhar
        const errorContainer = document.createElement("div");
        errorContainer.style.display = "none";
        errorContainer.style.width = "100%";
        errorContainer.style.padding = "30px";
        errorContainer.style.backgroundColor = "#f8d7da";
        errorContainer.style.color = "#721c24";
        errorContainer.style.borderRadius = "4px";
        errorContainer.style.textAlign = "center";
        errorContainer.style.marginBottom = "20px";
        errorContainer.innerHTML = `
            <h3>Não foi possível conectar à câmera</h3>
            <p>Verifique se a câmera está ligada e conectada à rede.</p>
        `;
        container.appendChild(errorContainer);

        // Contador de erros consecutivos
        let errorCount = 0;
        const MAX_ERRORS = 3;

        // Função para atualizar snapshot
        const updateSnapshot = () => {
            const timestamp = Date.now();
            errorContainer.style.display = "none"; // Esconder mensagem de erro

            img.onerror = () => {
                errorCount++;
                console.error(`Erro ao carregar imagem (${errorCount})`);

                if (errorCount >= MAX_ERRORS) {
                    // Após múltiplas falhas, mostrar mensagem de erro
                    errorContainer.style.display = "block";
                    log(`Falha ao conectar com a câmera. Nova tentativa em 10s...`);
                }
            };

            img.onload = () => {
                // Resetar contador de erros quando uma imagem carrega com sucesso
                errorCount = 0;
                log(`Imagem atualizada às ${new Date().toLocaleTimeString()}`);
            };

            // Definir src da imagem para disparar carregamento
            img.src = `/cameras/rua/snapshot.jpg?_t=${timestamp}`;
        };

        // Atualizar inicialmente
        updateSnapshot();

        // Configurar intervalo de atualização - mais lento se houver erros
        let updateInterval: NodeJS.Timeout;

        const startUpdateInterval = (interval = 5000) => {
            if (updateInterval) clearInterval(updateInterval);
            updateInterval = setInterval(() => {
                updateSnapshot();

                // Se tivermos muitos erros, ajustar o intervalo para mais lento
                if (errorCount >= MAX_ERRORS) {
                    if (updateInterval) clearInterval(updateInterval);
                    startUpdateInterval(10000); // 10 segundos
                }
            }, interval);
        };

        startUpdateInterval();

        // Botão para atualização manual
        const refreshButton = document.createElement("button");
        refreshButton.textContent = "Atualizar Agora";
        refreshButton.style.padding = "8px 16px";
        refreshButton.style.margin = "10px 0";
        refreshButton.style.backgroundColor = "#007bff";
        refreshButton.style.color = "white";
        refreshButton.style.border = "none";
        refreshButton.style.borderRadius = "4px";
        refreshButton.style.cursor = "pointer";
        refreshButton.onclick = updateSnapshot;
        container.appendChild(refreshButton);

        // Limpar ao desmontar
        return () => {
            if (updateInterval) clearInterval(updateInterval);
        };
    };

    // Iniciar quando DOM estiver pronto
    if (document.readyState === "complete") {
        initSnapshotViewer();
    } else {
        document.addEventListener("DOMContentLoaded", initSnapshotViewer);
    }
};

export default function Snapshot() {
    return (
        <Basic>
            <div style={{ maxWidth: "800px", margin: "20px auto" }}>
                <h1 style={{ textAlign: "center" }}>Câmera (Modo Estático)</h1>
                <div style={{ margin: "10px 0" }}>
                    <a
                        href="/"
                        style={{
                            color: "#007bff",
                            textDecoration: "none",
                        }}
                    >
                        &larr; Voltar para modo stream
                    </a>
                </div>
                <div
                    id="snapshotContainer"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        padding: "20px",
                        backgroundColor: "#f8f9fa",
                    }}
                />
                <div
                    style={{
                        margin: "20px 0",
                        fontSize: "14px",
                        color: "#666",
                    }}
                >
                    <p>
                        Este é o modo de visualização estática, recomendado para
                        conexões lentas ou quando o stream ao vivo não estiver
                        funcionando.
                    </p>
                </div>
            </div>
            <script src={useScriptAsDataURI(loadPage)} />
        </Basic>
    );
}
