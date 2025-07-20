import Home from "../../pages/home";
import Loading from "../../pages/loading";
import Login from "../../pages/login";
import OauthPage from "../../pages/oauth";
import SavedPromptsPage from "../../pages/saved-prompts";
import SchedulerPage from "../../pages/scheduler";
import WhatsAppPage from "../../pages/whatsapp";

export const LOGIN_PAGE = {
    name: "Login",
    protected: false,
    component: <Login />,
    id: "login",
};

export const LOADING_PAGE = {
    name: "Loading",
    protected: false,
    component: <Loading />,
    id: "loading",
};

export const HOME_PAGE = {
    name: "Home",
    protected: true,
    component: <Home />,
    id: "home",
};

export const OAUTH_SUCCESS_PAGE = {
    name: "Oauth Success",
    protected: false,
    component: <OauthPage type="success" />,
    id: "oauth-success",
};

export const OAUTH_ERROR_PAGE = {
    name: "Oauth Error",
    protected: false,
    component: <OauthPage type="error" />,
    id: "oauth-error",
};

export const WHATSAPP_PAGE = {
    name: "WhatsApp",
    protected: false,
    component: <WhatsAppPage />,
    id: "whatsapp",
};

export const SAVED_PROMPTS_PAGE = {
    name: "Saved Prompts",
    protected: true,
    component: <SavedPromptsPage />,
    id: "saved-prompts",
};

export const SCHEDULER_PAGE = {
    name: "Scheduler",
    protected: true,
    component: <SchedulerPage />,
    id: "scheduler",
};
