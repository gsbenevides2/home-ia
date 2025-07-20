import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import { client } from "../../client";
import * as pages from "./pages";

interface Page {
    name: string;
    protected: boolean;
    component: React.ReactNode;
    id: string;
}

interface PageContext {
    page: Page;
    setPage: React.Dispatch<React.SetStateAction<Page>>;
    isAuthenticated: boolean;
    loadIsAuthenticated: () => Promise<boolean>;
}

export const PageContext = createContext<PageContext>({
    page: pages.LOADING_PAGE,
    setPage: () => {},
    isAuthenticated: false,
    loadIsAuthenticated: async () => false,
});

export const PageProvider = () => {
    const [page, setPage] = useState<Page>(pages.LOADING_PAGE);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    const loadIsAuthenticated = useCallback(async () => {
        const response = await client["is-authenticated"].get();
        const isAuthenticated = response.data?.status === "Authenticated";
        setIsAuthenticated(isAuthenticated);
        return isAuthenticated;
    }, []);

    useEffect(() => {
        loadIsAuthenticated().then(
            (isAuthenticated) => {
                const urlQuery = new URLSearchParams(window.location.search);
                const location = urlQuery.get("page") ?? "home";
                const redirectPageById = Object.values(pages).find(
                    (page) => page.id === location,
                );
                if (!redirectPageById) {
                    setPage(pages.LOGIN_PAGE);
                    return;
                }
                setPage(isAuthenticated ? redirectPageById : pages.LOGIN_PAGE);
            },
        );
    }, []);

    const proxySetPage: React.Dispatch<React.SetStateAction<Page>> = (page) => {
        if (typeof page === "function") {
            setPage((prevPage) => {
                const newPage = page(prevPage);
                if (newPage.protected && !isAuthenticated) {
                    return pages.LOGIN_PAGE;
                }
                return newPage;
            });
            return;
        }

        if (page.protected && !isAuthenticated) {
            setPage(pages.LOGIN_PAGE);
            return;
        }

        setPage(page);
    };

    return (
        <PageContext.Provider
            value={{
                page,
                setPage: proxySetPage,
                isAuthenticated,
                loadIsAuthenticated,
            }}
        >
            {page.component}
        </PageContext.Provider>
    );
};

export const usePage = () => {
    return useContext(PageContext);
};
