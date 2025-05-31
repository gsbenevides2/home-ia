export default function SavedPromptsModal() {
    return (
        <>
            {/* Modal */}
            <aside
                className="mdc-drawer mdc-drawer--modal top-0  lg:min-w-[49vw]"
                id="modal"
            >
                <div className="mdc-drawer__content">
                    <h2
                        className="mdc-typography--headline6 p-4"
                        id="modal-title"
                    >
                    </h2>
                    <form className="p-4">
                        <label className="mdc-text-field mdc-text-field--filled mb-4 w-full">
                            <span className="mdc-text-field__ripple" />
                            <span className="mdc-floating-label">
                                Name
                            </span>
                            <input
                                type="text"
                                id="prompt-name"
                                className="mdc-text-field__input"
                                required
                            />
                            <span className="mdc-line-ripple" />
                        </label>

                        <label className="mdc-text-field mdc-text-field--filled mdc-text-field--textarea mb-4 !w-full">
                            <span className="mdc-text-field__ripple" />
                            <span
                                className="mdc-floating-label"
                                id="my-label-id"
                            >
                                Prompt
                            </span>
                            <span className="mdc-text-field__resizer w-full">
                                <textarea
                                    id="prompt-text"
                                    className="mdc-text-field__input w-full !min-h-[400px]"
                                    rows={5}
                                    required
                                >
                                </textarea>
                            </span>
                            <span className="mdc-line-ripple" />
                        </label>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                className="mdc-button"
                                hx-on:click="window.PAGE_SDK.closeModal()"
                            >
                                <span className="mdc-button__ripple"></span>
                                <span className="mdc-button__label">
                                    Cancel
                                </span>
                            </button>
                            <button
                                type="button"
                                className="mdc-button mdc-button--raised"
                                hx-on:click="window.PAGE_SDK.modalSave()"
                            >
                                <span className="mdc-button__ripple"></span>
                                <span className="mdc-button__label">
                                    Save
                                </span>
                            </button>
                        </div>
                    </form>
                </div>
            </aside>
            <div className="mdc-drawer-scrim"></div>
        </>
    );
}
