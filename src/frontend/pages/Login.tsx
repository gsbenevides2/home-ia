import { useScriptAsDataURI } from "../../utils/useScript";
import Basic from "../Basic";

interface LoginProps {
    error?: boolean;
}

export default function Login(props: LoginProps) {
    const loadInputs = useScriptAsDataURI(async () => {
        const textFields = document.querySelectorAll(".mdc-text-field");
        textFields.forEach((textField) => {
            new window.mdc.textField.MDCTextField(
                textField as HTMLInputElement,
            );
        });
    });

    return (
        <Basic>
            <div className="min-h-screen flex items-center justify-center">
                <div className="mdc-card w-full max-w-md p-8">
                    <h2 className="mdc-typography--headline4 text-center mb-8">
                        Login
                    </h2>
                    {props.error && (
                        <div className="bg-red-600 text-sm p-2 rounded-md flex items-center gap-2 mb-4 font-semibold">
                            <span className="material-icons text-red-500">
                                error
                            </span>
                            <p>
                                Nome de usuário ou senha inválidos. Por favor,
                                tente novamente.
                            </p>
                        </div>
                    )}
                    <form action="/login" method="POST">
                        <div className="flex flex-col gap-4">
                            <label className="mdc-text-field mdc-text-field--filled w-full">
                                <span className="mdc-text-field__ripple"></span>
                                <span
                                    className="mdc-floating-label"
                                    id="my-label-id"
                                >
                                    Nome de Usuário
                                </span>
                                <input
                                    type="text"
                                    className="mdc-text-field__input"
                                    id="username"
                                    name="username"
                                    required
                                />
                                <span className="mdc-line-ripple"></span>
                            </label>

                            <label className="mdc-text-field mdc-text-field--filled w-full">
                                <span className="mdc-text-field__ripple"></span>
                                <span
                                    className="mdc-floating-label"
                                    id="my-label-id"
                                >
                                    Senha
                                </span>
                                <input
                                    type="password"
                                    className="mdc-text-field__input"
                                    id="password"
                                    name="password"
                                    required
                                />
                                <span className="mdc-line-ripple"></span>
                            </label>
                        </div>

                        <div className="mt-8">
                            <button
                                type="submit"
                                className="mdc-button mdc-button--raised w-full"
                            >
                                <span className="mdc-button__ripple"></span>
                                <span className="mdc-button__label">
                                    Logar
                                </span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <script src={loadInputs} />
        </Basic>
    );
}
