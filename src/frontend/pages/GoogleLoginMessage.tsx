import Basic from "../Basic";

export interface GoogleLoginMessageProps {
    message: string;
}

export default function GoogleLoginMessage(props: GoogleLoginMessageProps) {
    return (
        <Basic>
            <div className="min-h-screen flex items-center justify-center">
                <div className="mdc-card w-full max-w-md p-8">
                    <div className="text-center">
                        <h2 className="mdc-typography--headline4 mb-4">
                            Login Result:
                        </h2>
                        <p className="mdc-typography--body1">{props.message}</p>
                    </div>
                </div>
            </div>
        </Basic>
    );
}
