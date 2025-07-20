import { Button } from "@rmwc/button";
import { Grid, GridCell } from "@rmwc/grid";
import { IconButton } from "@rmwc/icon-button";
import { Typography } from "@rmwc/typography";
import { useEffect, useState } from "react";
import { client } from "../../client";
import SchedulerModal from "./components/SchedulerModal";
import styles from "./styles.module.css";

type JobAPIResponse = {
    id: string;
    type: "cron" | "date";
    time: string;
    llm: string;
    exclude: boolean;
    created_at?: Date;
};

export default function SchedulerPage() {
    const [jobs, setJobs] = useState<JobAPIResponse[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState<JobAPIResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = "Scheduler - Home GCP";
        loadJobs();
    }, []);

    const loadJobs = async () => {
        try {
            setLoading(true);
            const response = await client.api.scheduler.jobs.get();
            if (response.data) {
                // Filtrar apenas jobs com types válidos
                const validJobs = response.data.filter((job: unknown) => {
                    const jobObj = job as Record<string, unknown>;
                    return jobObj.type === "cron" || jobObj.type === "date";
                }) as JobAPIResponse[];
                setJobs(validJobs);
            }
        } catch (error) {
            console.error("Error loading jobs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewJob = () => {
        setEditingJob(null);
        setIsModalOpen(true);
    };

    const handleEditJob = (job: JobAPIResponse) => {
        setEditingJob(job);
        setIsModalOpen(true);
    };

    const handleDeleteJob = async (id: string) => {
        if (confirm("Tem certeza que deseja deletar este job?")) {
            try {
                await client.api.scheduler.jobs({ id }).delete();
                await loadJobs();
            } catch (error) {
                console.error("Error deleting job:", error);
                alert("Erro ao deletar job");
            }
        }
    };

    const handleSaveJob = async (jobData: Omit<JobAPIResponse, "id">) => {
        try {
            if (editingJob) {
                await client.api.scheduler.jobs({ id: editingJob.id }).put(
                    jobData,
                );
            } else {
                await client.api.scheduler.jobs.post(jobData);
            }
            setIsModalOpen(false);
            setEditingJob(null);
            await loadJobs();
        } catch (error) {
            console.error("Error saving job:", error);
            alert("Erro ao salvar job");
        }
    };

    const formatType = (type: string) => {
        return type === "cron" ? "Cron" : "Data específica";
    };

    const formatTime = (time: string, type: string) => {
        if (type === "date") {
            try {
                return new Date(time).toLocaleString("pt-BR");
            } catch {
                return time;
            }
        }
        return time;
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
                    <Typography use="headline4">Scheduler</Typography>
                    <Button
                        raised
                        onClick={handleNewJob}
                        icon="add"
                    >
                        Novo Job
                    </Button>
                </div>

                <div className={styles.content}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.headerCell}>ID</th>
                                <th className={styles.headerCell}>Tipo</th>
                                <th className={styles.headerCell}>
                                    Agendamento
                                </th>
                                <th className={styles.headerCell}>LLM</th>
                                <th className={styles.headerCell}>
                                    Excluir após execução
                                </th>
                                <th className={styles.headerCell}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map((job) => (
                                <tr key={job.id} className={styles.row}>
                                    <td className={styles.idCell}>
                                        {job.id}
                                    </td>
                                    <td className={styles.typeCell}>
                                        <span
                                            className={`${styles.typeBadge} ${
                                                styles[`type${job.type}`]
                                            }`}
                                        >
                                            {formatType(job.type)}
                                        </span>
                                    </td>
                                    <td className={styles.timeCell}>
                                        {formatTime(job.time, job.type)}
                                    </td>
                                    <td className={styles.llmCell}>
                                        <div className={styles.llmText}>
                                            {job.llm}
                                        </div>
                                    </td>
                                    <td className={styles.excludeCell}>
                                        <span
                                            className={`${styles.excludeBadge} ${
                                                job.exclude
                                                    ? styles.excludeTrue
                                                    : styles.excludeFalse
                                            }`}
                                        >
                                            {job.exclude ? "Sim" : "Não"}
                                        </span>
                                    </td>
                                    <td className={styles.actionsCell}>
                                        <IconButton
                                            icon="edit"
                                            onClick={() =>
                                                handleEditJob(job)}
                                            title="Editar"
                                        />
                                        <IconButton
                                            icon="delete"
                                            onClick={() =>
                                                handleDeleteJob(job.id)}
                                            title="Deletar"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {jobs.length === 0 && (
                        <div className={styles.emptyState}>
                            <Typography use="body1">
                                Nenhum job agendado encontrado.
                            </Typography>
                        </div>
                    )}
                </div>

                <SchedulerModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingJob(null);
                    }}
                    onSave={handleSaveJob}
                    editingJob={editingJob}
                />
            </GridCell>
        </Grid>
    );
}
