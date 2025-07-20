import { Card } from "@rmwc/card";
import { Typography } from "@rmwc/typography";
import styles from "./styles.module.css";

export interface OauthPageProps {
    type: "success" | "error";
}

const messages = {
    success: "Login successful please close this window",
    error: "Login failed, close this window and try again",
};

export default function OauthPage(props: OauthPageProps) {
    return (
        <div className={styles.container}>
            <Card className={styles.card}>
                <div className={styles.text}>
                    <Typography use="headline4" className={styles.title}>
                        Login Result:
                    </Typography>
                    <Typography use="body1">
                        {messages[props.type]}
                    </Typography>
                </div>
            </Card>
        </div>
    );
}
