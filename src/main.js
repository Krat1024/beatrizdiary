import './styles/index.css';
import { renderApp } from './App.js';

// Global error handling for better debugging
window.onerror = function (message, source, lineno, colno, error) {
    alert(`Fatal Error: ${message}\nAt: ${source}:${lineno}:${colno}`);
    console.error("Fatal startup error:", error);
};

window.onunhandledrejection = function (event) {
    alert(`Unhandled Promise Rejection: ${event.reason}`);
    console.error("Unhandled promise rejection:", event.reason);
};

async function init() {
    try {
        console.log("Initializing application...");
        await renderApp();
        console.log("Application rendered successfully.");
    } catch (error) {
        alert(`Failed to start application: ${error.message}`);
        console.error("Startup crash:", error);
    }
}

init();
