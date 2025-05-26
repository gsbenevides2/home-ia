import { useId } from "react";
import { useScript, useScriptAsDataURI } from "../../utils/useScript";
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
    const selectId = useId();
    const clickInSelect = useScript((id: string) => {
        const element = document.getElementById(id);
        if (!element) {
            return;
        }
        const menu = new window.mdc.menu.MDCMenu(element);
        menu.open = true;
    }, selectId);
    return (
        <Basic>
            <div className="mdc-layout-grid">
                <div className="mdc-layout-grid__inner">
                    <div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="mdc-typography--headline4">
                                    Bem vindo Guilherme
                                </h1>
                                <p className="mdc-typography--body1 mt-1.5">
                                    O que deseja fazer hoje?
                                </p>
                            </div>
                            <div className="mdc-menu-surface--anchor">
                                <button
                                    className="mdc-icon-button material-icons"
                                    id="menu-button"
                                    aria-label="Menu"
                                    hx-on:click={clickInSelect}
                                >
                                    more_vert
                                </button>
                                <div
                                    className="mdc-menu mdc-menu-surface w-64"
                                    id={selectId}
                                >
                                    <ul
                                        className="mdc-list w-64"
                                        role="menu"
                                        aria-hidden="true"
                                        aria-orientation="vertical"
                                        tabIndex={-1}
                                    >
                                        <a
                                            className="mdc-list-item !py-3 !gap-2 !items-center"
                                            role="menuitem"
                                            href={props.googleLoginUrl}
                                            target="_blank"
                                        >
                                            <span className="mdc-list-item__ripple" />

                                            <span className="material-icons mdc-list-item__graphic !text-base">
                                                login
                                            </span>
                                            <span className="mdc-list-item__text">
                                                Reautenticar com o Google
                                            </span>
                                        </a>
                                        <a
                                            className="mdc-list-item !py-3 !gap-2 !items-center"
                                            role="menuitem"
                                            href="/logout"
                                        >
                                            <span className="mdc-list-item__ripple" />
                                            <span className="material-icons mdc-list-item__graphic !text-base">
                                                logout
                                            </span>
                                            <span className="mdc-list-item__text">
                                                Logout
                                            </span>
                                        </a>
                                        <a
                                            className="mdc-list-item !py-3 !gap-2 !items-center"
                                            role="menuitem"
                                            href="/whatsapp-auth"
                                        >
                                            <span className="mdc-list-item__ripple" />
                                            <span className="material-icons mdc-list-item__graphic !text-base">
                                                login
                                            </span>
                                            <span className="mdc-list-item__text">
                                                Login no WhatsApp
                                            </span>
                                        </a>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
