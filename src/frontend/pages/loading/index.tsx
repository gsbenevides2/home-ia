import { CircularProgress } from "@rmwc/circular-progress";
import styles from "./styles.module.css";

export default function Loading() {
    return (
        <div className={styles.container}>
            <CircularProgress label="Carregando..." size="xlarge" />
        </div>
    );
}
