import { Grid, GridCell } from "@rmwc/grid";
import { IconButton } from "@rmwc/icon-button";
import { List, SimpleListItem } from "@rmwc/list";
import { Menu, MenuSurfaceAnchor } from "@rmwc/menu";
import { Typography } from "@rmwc/typography";
import { useState } from "react";
import { OAUTH_STATER_URI_PATHNAME } from "../../../clients/google/OauthClient/constants";
import { usePage } from "../../context/PageContext";
import {
    SAVED_PROMPTS_PAGE,
    SCHEDULER_PAGE,
} from "../../context/PageContext/pages";
import CameraCard from "./components/CameraCard";
import styles from "./styles.module.css";

export default function Home() {
    const [menuOpen, setMenuOpen] = useState(false);
    const pageContext = usePage();
    return (
        <Grid className={styles.container}>
            <GridCell span={12}>
                <div className={styles.header}>
                    <div>
                        <Typography use="headline4">
                            Bem vindo Guilherme
                        </Typography>
                        <Typography use="body1" className={styles.subtitle}>
                            O que deseja fazer hoje?
                        </Typography>
                    </div>
                    <MenuSurfaceAnchor>
                        <Menu
                            className={styles.menu}
                            open={menuOpen}
                            onClose={() => setMenuOpen(false)}
                        >
                            <List>
                                <SimpleListItem
                                    graphic="login"
                                    text="Reautenticar com o Google"
                                    className={styles.menuItem}
                                    onClick={() => {
                                        window.open(
                                            OAUTH_STATER_URI_PATHNAME,
                                            "_blank",
                                        );
                                    }}
                                />
                                <SimpleListItem
                                    graphic="logout"
                                    text="Sair"
                                    className={styles.menuItem}
                                />
                                <SimpleListItem
                                    graphic="login"
                                    text="Login no WhatsApp"
                                    className={styles.menuItem}
                                    onClick={() => {
                                        window.open(
                                            "/?page=whatsapp",
                                            "_blank",
                                        );
                                    }}
                                />
                                <SimpleListItem
                                    graphic="save"
                                    text="Prompts salvas"
                                    className={styles.menuItem}
                                    onClick={() => {
                                        pageContext.setPage(SAVED_PROMPTS_PAGE);
                                        setMenuOpen(false);
                                    }}
                                />
                                <SimpleListItem
                                    graphic="schedule"
                                    text="Scheduler"
                                    className={styles.menuItem}
                                    onClick={() => {
                                        pageContext.setPage(SCHEDULER_PAGE);
                                        setMenuOpen(false);
                                    }}
                                />
                            </List>
                        </Menu>
                        <IconButton
                            icon="more_vert"
                            onClick={() => setMenuOpen(!menuOpen)}
                        />
                    </MenuSurfaceAnchor>
                </div>
                <div className={styles.content}>
                    <CameraCard
                        cameraId="rua"
                        cameraName="Câmera da rua"
                    />
                </div>
            </GridCell>
        </Grid>
    );
}
