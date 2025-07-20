import { Button } from "@rmwc/button";
import { Grid, GridCell } from "@rmwc/grid";
import { IconButton } from "@rmwc/icon-button";
import { Typography } from "@rmwc/typography";
import { useEffect, useState } from "react";
import { client } from "../../client";
import SavedPromptsModal from "./components/SavedPromptsModal";
import styles from "./styles.module.css";

type SavedPromptAPIResponse = {
    id: string;
    name: string;
    prompt: string;
};

export default function SavedPromptsPage() {
    const [prompts, setPrompts] = useState<SavedPromptAPIResponse[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<
        SavedPromptAPIResponse | null
    >(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = "Saved Prompts - Home GCP";
        loadPrompts();
    }, []);

    const loadPrompts = async () => {
        try {
            setLoading(true);
            const response = await client.service["saved-prompts"].get();
            if (response.data?.savedPrompts) {
                setPrompts(response.data.savedPrompts);
            }
        } catch (error) {
            console.error("Error loading prompts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewPrompt = () => {
        setEditingPrompt(null);
        setIsModalOpen(true);
    };

    const handleEditPrompt = (prompt: SavedPromptAPIResponse) => {
        setEditingPrompt(prompt);
        setIsModalOpen(true);
    };

    const handleDeletePrompt = async (id: string) => {
        if (confirm("Tem certeza que deseja deletar este prompt?")) {
            try {
                await client.service["saved-prompts"]({ id }).delete();
                await loadPrompts();
            } catch (error) {
                console.error("Error deleting prompt:", error);
                alert("Erro ao deletar prompt");
            }
        }
    };

    const handleSavePrompt = async (name: string, prompt: string) => {
        try {
            if (editingPrompt) {
                await client.service["saved-prompts"]({ id: editingPrompt.id })
                    .put({
                        name,
                        prompt,
                    });
            } else {
                await client.service["saved-prompts"].post({
                    name,
                    prompt,
                });
            }
            setIsModalOpen(false);
            setEditingPrompt(null);
            await loadPrompts();
        } catch (error) {
            console.error("Error saving prompt:", error);
            alert("Erro ao salvar prompt");
        }
    };

    if (loading) {
        return (
            <Grid className={styles.container}>
                <GridCell span={12}>
                    <Typography use="headline4">Carregando...</Typography>
                </GridCell>
            </Grid>
        );
    }

    return (
        <Grid className={styles.container}>
            <GridCell span={12}>
                <div className={styles.header}>
                    <Typography use="headline4">Saved Prompts</Typography>
                    <Button
                        raised
                        onClick={handleNewPrompt}
                        icon="add"
                    >
                        Novo Prompt
                    </Button>
                </div>

                <div className={styles.content}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.headerCell}>ID</th>
                                <th className={styles.headerCell}>Nome</th>
                                <th className={styles.headerCell}>Prompt</th>
                                <th className={styles.headerCell}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {prompts.map((prompt) => (
                                <tr key={prompt.id} className={styles.row}>
                                    <td className={styles.idCell}>
                                        {prompt.id}
                                    </td>
                                    <td className={styles.nameCell}>
                                        {prompt.name}
                                    </td>
                                    <td className={styles.promptCell}>
                                        <div className={styles.promptText}>
                                            {prompt.prompt}
                                        </div>
                                    </td>
                                    <td className={styles.actionsCell}>
                                        <IconButton
                                            icon="edit"
                                            onClick={() =>
                                                handleEditPrompt(prompt)}
                                            title="Editar"
                                        />
                                        <IconButton
                                            icon="delete"
                                            onClick={() =>
                                                handleDeletePrompt(prompt.id)}
                                            title="Deletar"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {prompts.length === 0 && (
                        <div className={styles.emptyState}>
                            <Typography use="body1">
                                Nenhum prompt salvo encontrado.
                            </Typography>
                        </div>
                    )}
                </div>

                <SavedPromptsModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingPrompt(null);
                    }}
                    onSave={handleSavePrompt}
                    editingPrompt={editingPrompt}
                />
            </GridCell>
        </Grid>
    );
}
