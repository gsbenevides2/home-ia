import { Button } from "@rmwc/button";
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from "@rmwc/dialog";
import { TextField } from "@rmwc/textfield";
import { useEffect, useState } from "react";
import styles from "./styles.module.css";

type SavedPromptAPIResponse = {
    id: string;
    name: string;
    prompt: string;
};

interface SavedPromptsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, prompt: string) => Promise<void>;
    editingPrompt?: SavedPromptAPIResponse | null;
}

export default function SavedPromptsModal({
    isOpen,
    onClose,
    onSave,
    editingPrompt,
}: SavedPromptsModalProps) {
    const [name, setName] = useState("");
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (editingPrompt) {
                setName(editingPrompt.name);
                setPrompt(editingPrompt.prompt);
            } else {
                setName("");
                setPrompt("");
            }
        }
    }, [isOpen, editingPrompt]);

    const handleSave = async () => {
        if (!name.trim() || !prompt.trim()) {
            alert("Por favor, preencha todos os campos");
            return;
        }

        try {
            setLoading(true);
            await onSave(name.trim(), prompt.trim());
            onClose();
        } catch (error) {
            console.error("Error saving prompt:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
        }
    };
    console.log({ isOpen });
    return (
        <Dialog open={isOpen} onClose={handleClose} className={styles.dialog}>
            <DialogTitle className={styles.title}>
                {editingPrompt ? "Editar Prompt" : "Novo Prompt"}
            </DialogTitle>

            <DialogContent className={styles.content}>
                <div className={styles.form}>
                    <TextField
                        label="Nome"
                        value={name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setName(e.currentTarget.value)}
                        fullwidth
                        required
                        disabled={loading}
                        className={styles.field}
                    />

                    <TextField
                        label="Prompt"
                        value={prompt}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setPrompt(e.currentTarget.value)}
                        textarea
                        rows={8}
                        fullwidth
                        required
                        disabled={loading}
                        className={styles.field}
                    />
                </div>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    raised
                    onClick={handleSave}
                    disabled={loading || !name.trim() || !prompt.trim()}
                >
                    {loading ? "Salvando..." : "Salvar"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
