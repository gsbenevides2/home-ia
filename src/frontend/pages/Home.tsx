import { useScriptAsDataURI } from "../../utils/useScript";
import Basic from "../Basic";
import CameraCard from "../components/CameraCard";

interface HomeProps {
    cameraList: string[];
    googleLoginUrl: string;
}

const setupLogoutConfirmation = () => {
    const logoutButton = document.querySelector('a[href="/logout"]');
    if (logoutButton) {
        logoutButton.addEventListener("click", (e) => {
            e.preventDefault();
            const confirmed = window.confirm(
                "Tem certeza que deseja sair?",
            );
            if (confirmed) {
                window.location.href = "/logout";
            }
        });
    }
};

export default function Home(props: HomeProps) {
    return (
        <Basic>
            <div className="mdc-layout-grid">
                <div className="mdc-layout-grid__inner">
                    <div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
                        <h1 className="mdc-typography--headline4">
                            Bem vindo Guilherme
                        </h1>
                        <p className="mdc-typography--body1 mt-1.5">
                            O que deseja fazer hoje?
                        </p>
                        <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            <CameraCard
                                cameraId="rua"
                                cameraName="Câmera da rua"
                            />
                            <CameraCard
                                cameraId="rua"
                                cameraName="Câmera da rua"
                            />
                            <CameraCard
                                cameraId="rua"
                                cameraName="Câmera da rua"
                            />
                            <CameraCard
                                cameraId="rua"
                                cameraName="Câmera da rua"
                            />
                            <CameraCard
                                cameraId="rua"
                                cameraName="Câmera da rua"
                            />
                            <CameraCard
                                cameraId="rua"
                                cameraName="Câmera da rua"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <script src={useScriptAsDataURI(setupLogoutConfirmation)} />
        </Basic>
    );
}
