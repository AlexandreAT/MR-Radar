import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "src/containers/App";

const elementoRaiz: HTMLElement | null = document.getElementById("root");

if (!elementoRaiz)
    throw new Error("Elemento root não encontrado no index.html.");

createRoot(elementoRaiz).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
