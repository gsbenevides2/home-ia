import Basic from "../Basic";

interface WhatsAppAuthProps {
    qrCode: string;
}

export default function WhatsAppAuth(props: WhatsAppAuthProps) {
    return (
        <Basic>
            <div className="min-h-screen flex items-center justify-center">
                <div className="mdc-card w-full max-w-md p-8">
                    <div className="text-center">
                        <h2 className="mdc-typography--headline4 mb-6">
                            WhatsApp Login
                        </h2>
                        <p className="mdc-typography--body1 mb-6 text-gray-600">
                            Escaneie o QR code abaixo com seu WhatsApp para
                            fazer login
                        </p>

                        <div className="flex justify-center mb-6">
                            <div className="p-4 bg-white rounded-lg shadow-sm border">
                                <img
                                    src={props.qrCode}
                                    alt="QR Code do WhatsApp"
                                    className="w-64 h-64 object-contain"
                                />
                            </div>
                        </div>

                        <div className="bg-gray-800 p-4 rounded-lg mb-4">
                            <div className="flex items-start gap-3">
                                <span className="material-icons text-gray-600 mt-0.5">
                                    info
                                </span>
                                <div className="text-left">
                                    <p className="mdc-typography--body2 text-blue-800 font-medium mb-2">
                                        Como escanear:
                                    </p>
                                    <ol className="mdc-typography--body2 text-blue-700 space-y-1 list-decimal list-inside">
                                        <li>Abra o WhatsApp no seu celular</li>
                                        <li>
                                            Toque em Menu (⋮) ou Configurações
                                        </li>
                                        <li>Toque em "Aparelhos conectados"</li>
                                        <li>Toque em "Conectar um aparelho"</li>
                                        <li>
                                            Aponte a câmera para este QR code
                                        </li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        <button
                            className="mdc-button mdc-button--outlined w-full"
                            onClick={() => window.location.reload()}
                        >
                            <span className="mdc-button__ripple"></span>
                            <span className="material-icons mdc-button__icon">
                                refresh
                            </span>
                            <span className="mdc-button__label">
                                Gerar novo QR Code
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </Basic>
    );
}
