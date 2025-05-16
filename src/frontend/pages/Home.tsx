import { useScriptAsDataURI } from "../../utils/useScript";
import Basic from "../Basic";
import Button from "../components/Button";
import Card from "../components/Card";

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
                "Are you sure you want to logout?",
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
            <Card title="Home">
                <div className="flex flex-col space-y-4">
                    {props.cameraList.map((camera: string) => (
                        <Button
                            key={camera}
                            href={`/camera/${camera}`}
                            variant="primary"
                        >
                            Camera {camera}
                        </Button>
                    ))}
                    <Button
                        href={props.googleLoginUrl}
                        variant="red"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Login with Google
                    </Button>
                    <Button href="/logout" variant="gray">
                        Logout
                    </Button>
                </div>
            </Card>
            <script src={useScriptAsDataURI(setupLogoutConfirmation)} />
        </Basic>
    );
}
