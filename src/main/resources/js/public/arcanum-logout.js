"use strict";

document.addEventListener("DOMContentLoaded", () => {
    performArcanumLogout();
});

async function performArcanumLogout() {
    const message = document.getElementById("arcanum-logout-message");
    if (new URLSearchParams(window.location.search).get("session") === "ended") {
        return;
    }

    try {
        const response = await fetch("/logout", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
            redirect: "follow"
        });

        if (response.status === 429) {
            const retryAfter = Number.parseInt(response.headers.get("Retry-After") || "", 10);
            await wait(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 300) * 1000 : 1800);

            const retry = await fetch("/logout", {
                method: "GET",
                credentials: "same-origin",
                cache: "no-store",
                redirect: "follow"
            });
            if (retry.status === 429 && message) {
                message.textContent = "Die Abmeldung wird nach der kurzen Zugriffspause abgeschlossen.";
            }
        }
    } catch (error) {
        console.warn(
            "Arcanum: Der Logout-Aufruf konnte nicht bestätigt werden.",
            error
        );

        if (message) {
            message.textContent =
                "Du wurdest abgemeldet. Du kannst dich später wieder anmelden.";
        }
    }
}

function wait(milliseconds) {
    return new Promise(resolve => {
        window.setTimeout(resolve, milliseconds);
    });
}
