interface CameraCardProps {
    cameraId: string;
    cameraName: string;
}

export default function CameraCard(props: CameraCardProps) {
    return (
        <div className="flex relative cursor-pointer">
            <video
                className="w-full relative rounded-2xl aspect-video"
                poster={`/cameras-service/${props.cameraId}/snapshot.jpg`}
                muted
                playsInline
            />
            <div className="absolute bottom-0 left-0 w-full bg-black/50 p-2 flex justify-between">
                <div>
                    <p className="mdc-typography--body1">
                        {props.cameraName}
                    </p>
                    <p className="mdc-typography--body2">
                        Iniciando...
                    </p>
                </div>
                <div className="flex items-center">
                    <button
                        className="mdc-icon-button material-icons mx-1"
                        title="Ativar/desativar som"
                    >
                        volume_off
                    </button>
                    <button
                        className="mdc-icon-button material-icons mx-1"
                        title="Mover para cima"
                    >
                        arrow_upward
                    </button>
                    <button
                        className="mdc-icon-button material-icons mx-1"
                        title="Mover para baixo"
                    >
                        arrow_downward
                    </button>
                    <button
                        className="mdc-icon-button material-icons mx-1"
                        title="Mover para esquerda"
                    >
                        arrow_back
                    </button>
                    <button
                        className="mdc-icon-button material-icons mx-1"
                        title="Mover para direita"
                    >
                        arrow_forward
                    </button>
                </div>
            </div>
        </div>
    );
}
