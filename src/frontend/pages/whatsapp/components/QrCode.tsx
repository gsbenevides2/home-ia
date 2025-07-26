import { Card } from "@rmwc/card";
import { Typography } from "@rmwc/typography";
import styles from "../styles.module.css";

type Props = {
    qrCode: string;
};

export default function QrCode(props: Props) {
    return (
        <div className={styles.qrCodePageContainer}>
            <Card className={styles.card}>
                <div className={styles.titleArea}>
                    <Typography use="headline4" className={styles.title}>
                        WhatsApp Login
                    </Typography>
                    <Typography use="body1" className={styles.subtitle}>
                        Escaneie o QR code abaixo com seu WhatsApp para fazer
                        login
                    </Typography>

                    <div className={styles.qrCodeArea}>
                        <div className={styles.qrCodeContainer}>
                            <img
                                src={props.qrCode}
                                alt="QR Code do WhatsApp"
                                className={styles.qrCode}
                            />
                        </div>
                    </div>

                    <div className={styles.infoArea}>
                        <div className={styles.infoContent}>
                            <span className={`material-icons ${styles.icon}`}>
                                info
                            </span>

                            <div className={styles.infoText}>
                                <Typography
                                    use="body2"
                                    className={styles.paragraph}
                                >
                                    Como escanear:
                                </Typography>
                                <ol className={styles.list}>
                                    <li>
                                        Abra o WhatsApp no seu celular
                                    </li>
                                    <li>
                                        Toque em Menu (⋮) ou Configurações
                                    </li>
                                    <li>
                                        Toque em "Aparelhos conectados"
                                    </li>
                                    <li>
                                        Toque em "Conectar um aparelho"
                                    </li>
                                    <li>
                                        Aponte a câmera para este QR code
                                    </li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
