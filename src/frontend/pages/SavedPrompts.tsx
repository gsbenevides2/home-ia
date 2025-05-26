import { useId } from "react";
import type { SavedPromptDatabaseRow } from "../../clients/database/savedPrompts";
import { useScript, useScriptAsDataURI } from "../../utils/useScript";
import Basic from "../Basic";
import SavedPromptsModal from "../components/SavedPromptsModal";

interface SavedPromptsProps {
    prompts: SavedPromptDatabaseRow[];
}

declare global {
    interface Window {
        PAGE_SDK: {
            modalMode: "new" | "edit";
            selectedPrompt: string | null;
            newPrompt: () => void;
            modalSave: () => void;
            closeModal: () => void;
            deletePrompt: (id: string) => void;
            openModalInEditMode: (id: string) => void;
        };
    }
}

export default function SavedPrompts(props: SavedPromptsProps) {
    const containerId = useId();

    const sdk = useScriptAsDataURI(
        (containerId: string) => {
            const container = document.getElementById(
                containerId,
            ) as HTMLDivElement;
            const modal = container.querySelector("#modal") as HTMLDivElement;
            const modalTitle = modal.querySelector(
                "#modal-title",
            ) as HTMLHeadingElement;
            const modalName = modal.querySelector(
                "#prompt-name",
            ) as HTMLInputElement;
            const modalPrompt = modal.querySelector(
                "#prompt-text",
            ) as HTMLTextAreaElement;

            window.PAGE_SDK = {
                modalMode: "new",
                selectedPrompt: null,

                newPrompt: () => {
                    window.PAGE_SDK.modalMode = "new";
                    window.PAGE_SDK.selectedPrompt = null;
                    modalTitle.textContent = "New Prompt";
                    window.mdc.drawer.MDCDrawer.attachTo(modal).open = true;
                },
                modalSave: async () => {
                    const name = modalName.value;
                    const prompt = modalPrompt.value;
                    if (name && prompt && window.PAGE_SDK.modalMode === "new") {
                        await window.axios.post("/service/saved-prompts", {
                            name,
                            prompt,
                        });
                        alert("Prompt saved");
                        window.location.reload();
                    } else if (
                        name && prompt && window.PAGE_SDK.modalMode === "edit"
                    ) {
                        await window.axios.put(
                            `/service/saved-prompts/${window.PAGE_SDK.selectedPrompt}`,
                            {
                                name,
                                prompt,
                            },
                        );
                        alert("Prompt updated");
                        window.location.reload();
                    }
                },
                deletePrompt: async (id: string) => {
                    await window.axios.delete(`/service/saved-prompts/${id}`);
                    alert("Prompt deleted");
                    window.location.reload();
                },
                closeModal: () => {
                    window.mdc.drawer.MDCDrawer.attachTo(modal).open = false;
                },
                openModalInEditMode: async (id: string) => {
                    window.PAGE_SDK.modalMode = "edit";
                    window.PAGE_SDK.selectedPrompt = id;
                    modalTitle.textContent = "Edit Prompt";
                    const prompt = await window.axios.get<{
                        name: string;
                        prompt: string;
                    }>(
                        `/service/saved-prompts/${id}`,
                    );
                    modalName.value = prompt.data.name;
                    modalPrompt.value = prompt.data.prompt;
                    window.mdc.drawer.MDCDrawer.attachTo(modal).open = true;
                },
            };

            const buttons = container.querySelectorAll(".mdc-icon-button");
            buttons.forEach((button) => {
                window.mdc.ripple.MDCRipple.attachTo(button);
            });

            const drawers = container.querySelectorAll(".mdc-drawer");
            drawers.forEach((drawer) => {
                window.mdc.drawer.MDCDrawer.attachTo(drawer);
            });

            const dataTables = container.querySelectorAll(".mdc-data-table");
            dataTables.forEach((dataTable) => {
                window.mdc.dataTable.MDCDataTable.attachTo(dataTable);
            });

            const inputs = container.querySelectorAll(".mdc-text-field");
            inputs.forEach((input) => {
                window.mdc.textField.MDCTextField.attachTo(input);
            });
        },
        containerId,
    );

    return (
        <Basic>
            <div id={containerId}>
                <div className="p-4">
                    <div className="flex justify-between mb-4">
                        <h1 className="mdc-typography--headline4">
                            Saved Prompts
                        </h1>
                        <button
                            className="mdc-button mdc-button--raised"
                            hx-on:click="window.PAGE_SDK.newPrompt()"
                        >
                            <span className="mdc-button__ripple"></span>
                            <span className="mdc-button__label">
                                New Prompt
                            </span>
                        </button>
                    </div>

                    <div className="mdc-data-table w-full">
                        <table className="mdc-data-table__table">
                            <thead>
                                <tr className="mdc-data-table__header-row">
                                    <th className="mdc-data-table__header-cell w-2/12">
                                        ID
                                    </th>
                                    <th className="mdc-data-table__header-cell w-3/12">
                                        Name
                                    </th>
                                    <th className="mdc-data-table__header-cell w-6/12">
                                        Prompt
                                    </th>
                                    <th className="mdc-data-table__header-cell w-1/12 !text-center">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="mdc-data-table__content">
                                {props.prompts?.map((prompt) => (
                                    <tr
                                        key={prompt.id}
                                        className="mdc-data-table__row"
                                    >
                                        <td className="mdc-data-table__cell w-2/12">
                                            {prompt.id}
                                        </td>
                                        <td className="mdc-data-table__cell w-3/12">
                                            {prompt.name}
                                        </td>
                                        <td className="mdc-data-table__cell w-6/12 whitespace-pre-wrap">
                                            {prompt.prompt}
                                        </td>
                                        <td className="mdc-data-table__cell w-1/12">
                                            <button
                                                className="mdc-icon-button material-icons mx-1"
                                                title="Edit"
                                                hx-on:click={useScript(
                                                    (promptId: string) => {
                                                        window.PAGE_SDK
                                                            .openModalInEditMode(
                                                                promptId,
                                                            );
                                                    },
                                                    prompt.id,
                                                )}
                                            >
                                                edit
                                            </button>
                                            <button
                                                className="mdc-icon-button material-icons mx-1"
                                                title="Delete"
                                                hx-on:click={useScript(
                                                    (promptId: string) => {
                                                        window.PAGE_SDK
                                                            .deletePrompt(
                                                                promptId,
                                                            );
                                                    },
                                                    prompt.id,
                                                )}
                                            >
                                                delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <SavedPromptsModal />
            </div>
            <script src={sdk} />
        </Basic>
    );
}
