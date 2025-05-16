import Basic from "../Basic";

interface HomeProps {
    cameraList: string[];
    googleLoginUrl: string;
}

export default function Home(props: HomeProps) {
    return (
        <Basic>
            <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
                <div className="relative py-3 sm:max-w-xl sm:mx-auto">
                    <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
                        <div className="max-w-md mx-auto">
                            <div className="divide-y divide-gray-200">
                                <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                                    <h1 className="text-3xl font-bold text-center mb-8">
                                        Home
                                    </h1>
                                    <div className="flex flex-col space-y-4">
                                        {props.cameraList.map((
                                            camera: string,
                                        ) => (
                                            <a
                                                key={camera}
                                                href={`/camera/${camera}`}
                                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-center"
                                            >
                                                Camera {camera}
                                            </a>
                                        ))}
                                        <a
                                            href={props.googleLoginUrl}
                                            target="_blank"
                                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-center mt-4"
                                        >
                                            Login with Google
                                        </a>
                                        <a
                                            href="/logout"
                                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-center mt-4"
                                        >
                                            Logout
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Basic>
    );
}
