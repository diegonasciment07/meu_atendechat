import React, { useState, useEffect } from "react";

import "react-toastify/dist/ReactToastify.css";
import { QueryClient, QueryClientProvider } from "react-query";

import {enUS, ptBR, esES} from "@material-ui/core/locale";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import { useMediaQuery } from "@material-ui/core";
import ColorModeContext from "./layout/themeContext";
import { SocketContext, SocketManager } from './context/Socket/SocketContext';

import Routes from "./routes";

const queryClient = new QueryClient();

const App = () => {
    const [locale, setLocale] = useState();

    const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
    const preferredTheme = window.localStorage.getItem("preferredTheme");
    const [mode, setMode] = useState(preferredTheme ? preferredTheme : prefersDarkMode ? "dark" : "light");

    const colorMode = React.useMemo(
        () => ({
            toggleColorMode: () => {
                setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
            },
        }),
        []
    );

    const theme = createTheme(
        {
            shape: {
                borderRadius: 12, // Bordas arredondadas globais
            },
            components: {
                MuiButton: {
                    styleOverrides: {
                        root: {
                            borderRadius: 12,
                        },
                    },
                },
                MuiPaper: {
                    styleOverrides: {
                        root: {
                            borderRadius: 12,
                        },
                    },
                },
                MuiCard: {
                    styleOverrides: {
                        root: {
                            borderRadius: 12,
                        },
                    },
                },
                MuiTextField: {
                    styleOverrides: {
                        root: {
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 12,
                            },
                        },
                    },
                },
                MuiDialog: {
                    styleOverrides: {
                        paper: {
                            borderRadius: 12,
                        },
                    },
                },
                MuiMenu: {
                    styleOverrides: {
                        paper: {
                            borderRadius: 12,
                        },
                    },
                },
            },
            scrollbarStyles: {
                "&::-webkit-scrollbar": {
                    width: '8px',
                    height: '8px',
                },
                "&::-webkit-scrollbar-thumb": {
                    boxShadow: 'inset 0 0 6px rgba(0, 0, 0, 0.3)',
                    backgroundColor: "#21EDAD",
                    borderRadius: 8,
                },
            },
            scrollbarStylesSoft: {
                "&::-webkit-scrollbar": {
                    width: "8px",
                },
                "&::-webkit-scrollbar-thumb": {
                    backgroundColor: mode === "light" ? "#0A051E" : "#21C9AD",
                },
            },
            palette: {
                type: mode,
                primary: { main: mode === "light" ? "#161616" : "#1FDCA1" },
                textPrimary: mode === "light" ? "#21EDAD" : "#0A051E",
                borderPrimary: mode === "light" ? "#21EDAD" : "#0A051E",
                dark: { main: mode === "light" ? "#0A051E" : "#30c9a3" },
                light: { main: mode === "light" ? "#0A051E" : "#0A051E" },
                tabHeaderBackground: mode === "light" ? "#ebebeb" : "#424242",
                optionsBackground: mode === "light" ? "#fafafa" : "#161616",
				options: mode === "light" ? "#fafafa" : "#0A051E",
				fontecor: mode === "light" ? "#128c7e" : "#0A051E",
                fancyBackground: mode === "light" ? "#fafafa" : "#161616 ",
				bordabox: mode === "light" ? "#eee" : "#161616 ",
				newmessagebox: mode === "light" ? "#eee" : "#161616 ",
				inputdigita: mode === "light" ? "#e3e3e3" : "#545454",
				contactdrawer: mode === "light" ? "#e3e3e3" : "#0A051E",
				announcements: mode === "light" ? "#ededed" : "#161616",
				login: mode === "light" ? "#f3f3f3" : "#0A051E",
				announcementspopover: mode === "light" ? "#c9c9c9" : "#0A051E",
				chatlist: mode === "light" ? "#eee" : "#0A051E",
				boxlist: mode === "light" ? "#ededed" : "#0A051E",
				boxchatlist: mode === "light" ? "#ededed" : "#161616",
                total: mode === "light" ? "#0A051E" : "#222",
                messageIcons: mode === "light" ? "#21B5AD" : "#cfffdc",
                inputBackground: mode === "light" ? "#e3e3e3" : "#161616",
                barraSuperior: mode === "light" ? "linear-gradient(to right, #0A051E, #0A051E , #0A051E)" : "#0A051E",
				boxticket: mode === "light" ? "#EEE" : "#0A051E",
				campaigntab: mode === "light" ? "#ededed" : "#0A051E",
				mediainput: mode === "light" ? "#ededed" : "#21D2AD",
				sidebarBackground: mode === "light" ? "#ffffff" : "#161616",
				sidebarText: mode === "light" ? "#333333" : "#ffffff",
				sidebarIcon: mode === "light" ? "#666666" : "#ffffff",
            },
            mode,
        },
        locale
    );

    useEffect(() => {
        const i18nlocale = localStorage.getItem("i18nextLng");
        const browserLocale = i18nlocale?.substring(0, 2) ?? 'pt';

        if (browserLocale === "pt"){
            setLocale(ptBR);
        }else if( browserLocale === "en" ) {
            setLocale(enUS)
        }else if( browserLocale === "es" )
            setLocale(esES)

    }, []);

    useEffect(() => {
        window.localStorage.setItem("preferredTheme", mode);
    }, [mode]);



    return (
        <ColorModeContext.Provider value={{ colorMode }}>
            <ThemeProvider theme={theme}>
                <QueryClientProvider client={queryClient}>
                  <SocketContext.Provider value={SocketManager}>
                      <Routes />
                  </SocketContext.Provider>
                </QueryClientProvider>
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
};

export default App;
