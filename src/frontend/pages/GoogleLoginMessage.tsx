import Basic from "../Basic";

export interface GoogleLoginMessageProps {
    message: string;
}

export default function GoogleLoginMessage(props: GoogleLoginMessageProps) {
    return (
        <Basic>
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Login Result:
                        </h2>
                        <p className="text-gray-600">{props.message}</p>
                    </div>
                </div>
            </div>
        </Basic>
    );
}
