import styles from "./styles.module.css";

export default function SuccessWhatsApp() {
    return (
        <div className={styles.successContainer}>
            <div className={styles.card}>
                <div className={styles.titleArea}>
                    <span className={`material-icons ${styles.icon}`}>
                        check_circle
                    </span>
                    <h1 className={styles.title}>WhatsApp Conectado</h1>
                </div>
                <p className={styles.message}>
                    O WhatsApp foi autenticado com sucesso. Você já pode fechar
                    esta janela.
                </p>
            </div>
        </div>
    );
}
