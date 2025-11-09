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
            scrollbarStyles: {
                "&::-webkit-scrollbar": {
                    width: '8px',
                    height: '8px',
                },
                "&::-webkit-scrollbar-thumb": {
                    boxShadow: 'inset 0 0 6px rgba(0, 0, 0, 0.3)',
                    backgroundColor: "#682EE3",
                },
            },
            scrollbarStylesSoft: {
                "&::-webkit-scrollbar": {
                    width: "8px",
                },
                "&::-webkit-scrollbar-thumb": {
                    backgroundColor: mode === "light" ? "#F3F3F3" : "#333333",
                },
            },
            palette: {
  type: mode,

  // Cores principais
  primary: { main: mode === "light" ? "#0F3D35" : "#C6A664" },
  textPrimary: mode === "light" ? "#0F3D35" : "#F4F4F4",
  borderPrimary: mode === "light" ? "#C6A664" : "#C6A664",

  // Tons de contraste
  dark: { main: mode === "light" ? "#1E554D" : "#F3F3F3" },
  light: { main: mode === "light" ? "#F4F4F4" : "#1E554D" },

  // Abas, menus e áreas de fundo
  tabHeaderBackground: mode === "light" ? "#DCE2DF" : "#0F3D35",
  optionsBackground: mode === "light" ? "#FFFFFF" : "#1E554D",
  options: mode === "light" ? "#FFFFFF" : "#1E554D",

  // Cor de texto e ícones
  fontecor: mode === "light" ? "#0F3D35" : "#F4F4F4",

  // Fundos e containers
  fancyBackground: mode === "light" ? "#FFFFFF" : "#0F3D35",
  bordabox: mode === "light" ? "#C6A664" : "#C6A664",
  newmessagebox: mode === "light" ? "#FFFFFF" : "#1E554D",
  inputdigita: mode === "light" ? "#FFFFFF" : "#1E554D",
  contactdrawer: mode === "light" ? "#FFFFFF" : "#1E554D",
  announcements: mode === "light" ? "#DCE2DF" : "#1E554D",
  login: mode === "light" ? "#FFFFFF" : "#0B2C27",
  announcementspopover: mode === "light" ? "#FFFFFF" : "#1E554D",
  chatlist: mode === "light" ? "#DCE2DF" : "#1E554D",
  boxlist: mode === "light" ? "#DCE2DF" : "#1E554D",
  boxchatlist: mode === "light" ? "#DCE2DF" : "#0F3D35",
  total: mode === "light" ? "#FFFFFF" : "#0F3D35",

  // Ícones e inputs
  messageIcons: mode === "light" ? "#C6A664" : "#F4F4F4",
  inputBackground: mode === "light" ? "#FFFFFF" : "#0B2C27",

  // Barra superior e cartões
  barraSuperior:
    mode === "light"
      ? "linear-gradient(to right, #0F3D35, #1E554D)"
      : "linear-gradient(to right, #0B2C27, #0F3D35)",
  boxticket: mode === "light" ? "#DCE2DF" : "#1E554D",
  campaigntab: mode === "light" ? "#DCE2DF" : "#1E554D",
  mediainput: mode === "light" ? "#DCE2DF" : "#0B2C27",

  // Estados e feedback
  success: { main: "#C6A664" },
  error: { main: "#B25B52" },
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
