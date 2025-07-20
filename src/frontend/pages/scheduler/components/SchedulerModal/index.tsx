import { Button } from "@rmwc/button";
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from "@rmwc/dialog";
import { Radio } from "@rmwc/radio";
import { Switch } from "@rmwc/switch";
import { TextField } from "@rmwc/textfield";
import { useEffect, useState } from "react";
import styles from "./styles.module.css";

type JobAPIResponse = {
    id: string;
    type: "cron" | "date";
    time: string;
    llm: string;
    exclude: boolean;
};

interface SchedulerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (jobData: Omit<JobAPIResponse, "id">) => Promise<void>;
    editingJob?: JobAPIResponse | null;
}

export default function SchedulerModal({
    isOpen,
    onClose,
    onSave,
    editingJob,
}: SchedulerModalProps) {
    const [type, setType] = useState<"cron" | "date">("cron");
    const [time, setTime] = useState("");
    const [llm, setLlm] = useState("");
    const [exclude, setExclude] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (editingJob) {
                setType(editingJob.type);
                setTime(editingJob.time);
                setLlm(editingJob.llm);
                setExclude(editingJob.exclude);
            } else {
                setType("cron");
                setTime("");
                setLlm("");
                setExclude(false);
            }
        }
    }, [isOpen, editingJob]);

    const handleSave = async () => {
        if (!time.trim() || !llm.trim()) {
            alert("Por favor, preencha todos os campos obrigatórios");
            return;
        }

        // Validação básica para cron
        if (type === "cron" && time.trim().split(" ").length < 5) {
            alert(
                "Formato de cron inválido. Use o formato: minuto hora dia mês dia_semana",
            );
            return;
        }

        // Validação básica para data
        if (type === "date") {
            try {
                const dateValue = new Date(time);
                if (isNaN(dateValue.getTime())) {
                    throw new Error("Data inválida");
                }
                if (dateValue <= new Date()) {
                    alert("A data deve ser no futuro");
                    return;
                }
            } catch {
                alert(
                    "Formato de data inválido. Use o formato ISO: YYYY-MM-DDTHH:mm:ss",
                );
                return;
            }
        }

        try {
            setLoading(true);
            await onSave({
                type,
                time: time.trim(),
                llm: llm.trim(),
                exclude,
            });
        } catch (error) {
            console.error("Error saving job:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
        }
    };

    const formatDateTimeForInput = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toISOString().slice(0, 16);
        } catch {
            return "";
        }
    };

    const handleDateTimeChange = (value: string) => {
        try {
            const date = new Date(value);
            setTime(date.toISOString());
        } catch {
            setTime(value);
        }
    };

    return (
        <Dialog open={isOpen} onClose={handleClose} className={styles.dialog}>
            <DialogTitle className={styles.title}>
                {editingJob ? "Editar Job" : "Novo Job"}
            </DialogTitle>

            <DialogContent className={styles.content}>
                <div className={styles.form}>
                    <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>
                            Tipo de Agendamento
                        </h4>
                        <div className={styles.radioGroup}>
                            <Radio
                                checked={type === "cron"}
                                onChange={() =>
                                    setType("cron")}
                                label="Cron (recorrente)"
                                value="cron"
                                name="scheduleType"
                                disabled={loading}
                            />
                            <Radio
                                checked={type === "date"}
                                onChange={() =>
                                    setType("date")}
                                label="Data específica (única execução)"
                                value="date"
                                name="scheduleType"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>Agendamento</h4>
                        {type === "cron"
                            ? (
                                <>
                                    <TextField
                                        label="Expressão Cron"
                                        value={time}
                                        onChange={(
                                            e: React.ChangeEvent<
                                                HTMLInputElement
                                            >,
                                        ) => setTime(e.currentTarget.value)}
                                        fullwidth
                                        required
                                        disabled={loading}
                                        className={styles.field}
                                        helpText="Formato: minuto hora dia mês dia_semana (ex: 0 9 * * 1-5 para 9h de segunda a sexta)"
                                    />
                                </>
                            )
                            : (
                                <>
                                    <input
                                        type="datetime-local"
                                        value={formatDateTimeForInput(time)}
                                        onChange={(e) =>
                                            handleDateTimeChange(
                                                e.target.value,
                                            )}
                                        className={styles.dateInput}
                                        disabled={loading}
                                        required
                                    />
                                    <div className={styles.helpText}>
                                        Selecione a data e hora para execução
                                        única
                                    </div>
                                </>
                            )}
                    </div>

                    <TextField
                        label="Comando/Prompt LLM"
                        value={llm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setLlm(e.currentTarget.value)}
                        textarea
                        rows={4}
                        fullwidth
                        required
                        disabled={loading}
                        className={styles.field}
                        helpText="Comando ou prompt que será executado pelo LLM"
                    />

                    <div className={styles.switchContainer}>
                        <Switch
                            checked={exclude}
                            onChange={(
                                evt: React.ChangeEvent<HTMLInputElement>,
                            ) => setExclude(evt.currentTarget.checked)}
                            label="Excluir job após execução"
                            disabled={loading}
                        />
                        <div className={styles.helpText}>
                            Se ativado, o job será automaticamente removido após
                            a primeira execução
                        </div>
                    </div>
                </div>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    raised
                    onClick={handleSave}
                    disabled={loading || !time.trim() || !llm.trim()}
                >
                    {loading ? "Salvando..." : "Salvar"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
