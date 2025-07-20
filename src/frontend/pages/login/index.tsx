import { Button } from "@rmwc/button";
import { Card } from "@rmwc/card";
import { Icon } from "@rmwc/icon";
import { TextField } from "@rmwc/textfield";
import { Typography } from "@rmwc/typography";
import { useState } from "react";
import { client } from "../../client";
import { usePage } from "../../context/PageContext";
import { HOME_PAGE } from "../../context/PageContext/pages";
import styles from "./styles.module.css";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { setPage, loadIsAuthenticated } = usePage();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const response = await client.login.post({
            username,
            password,
        });
        if (response.data?.status === "Login successful") {
            await loadIsAuthenticated().then((isAuthenticated) => {
                if (isAuthenticated) {
                    setPage(HOME_PAGE);
                }
            });
        } else {
            setError(
                "Nome de usuário ou senha inválidos. Por favor, tente novamente.",
            );
        }
    };
    return (
        <div className={styles.container}>
            <Card className={styles.card}>
                <Typography use="headline4" className={styles.title}>
                    Login
                </Typography>
                {error
                    ? (
                        <div className={styles.error}>
                            <Icon icon="error" />
                            <p>
                                Nome de usuário ou senha inválidos. Por favor,
                                tente novamente.
                            </p>
                        </div>
                    )
                    : null}
                <form onSubmit={handleSubmit}>
                    <div className={styles.formInputs}>
                        <TextField
                            label="Nome de usuário"
                            className={styles.formInput}
                            value={username}
                            required
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                            ) => setUsername(e.target.value)}
                        />
                        <TextField
                            label="Senha"
                            type="password"
                            className={styles.formInput}
                            value={password}
                            required
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                            ) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className={styles.buttonContainer}>
                        <Button raised className={styles.button}>
                            Login
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
