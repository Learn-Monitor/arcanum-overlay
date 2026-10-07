        const inspirationCards = [
            {
                        "image": "/arcanum-inspiration-01-mut-666eba92dbcb31bf.webp",
                        "alt": "Inspiration des Tages: Mut"
            },
            {
                        "image": "/arcanum-inspiration-02-neugier-1ada1180b0899f37.webp",
                        "alt": "Inspiration des Tages: Neugier"
            },
            {
                        "image": "/arcanum-inspiration-03-lernen-ec624e15d348ee52.webp",
                        "alt": "Inspiration des Tages: Lernen"
            },
            {
                        "image": "/arcanum-inspiration-04-zusammenhalt-14cee52917508b14.webp",
                        "alt": "Inspiration des Tages: Zusammenhalt"
            },
            {
                        "image": "/arcanum-inspiration-05-dranbleiben-600e7ad17aac285a.webp",
                        "alt": "Inspiration des Tages: Dranbleiben"
            },
            {
                        "image": "/arcanum-inspiration-06-selbstvertrauen-89afad4bc2fcc846.webp",
                        "alt": "Inspiration des Tages: Selbstvertrauen"
            },
            {
                        "image": "/arcanum-inspiration-07-fragen-67c3fddee5ea1b18.webp",
                        "alt": "Inspiration des Tages: Fragen"
            },
            {
                        "image": "/arcanum-inspiration-08-ideen-8434eb7d8e061113.webp",
                        "alt": "Inspiration des Tages: Ideen"
            },
            {
                        "image": "/arcanum-inspiration-09-abenteuer-3097f180350bb653.webp",
                        "alt": "Inspiration des Tages: Abenteuer"
            },
            {
                        "image": "/arcanum-inspiration-10-entdeckerweisheit-b6c16f82437c8f81.webp",
                        "alt": "Inspiration des Tages: Entdeckerweisheit"
            },
            {
                        "image": "/arcanum-inspiration-11-geduld-8867426ace1b6189.webp",
                        "alt": "Inspiration des Tages: Geduld"
            },
            {
                        "image": "/arcanum-inspiration-12-hilfsbereitschaft-8447ca0949298f17.webp",
                        "alt": "Inspiration des Tages: Hilfsbereitschaft"
            },
            {
                        "image": "/arcanum-inspiration-13-verantwortung-372dba4954b72e7f.webp",
                        "alt": "Inspiration des Tages: Verantwortung"
            },
            {
                        "image": "/arcanum-inspiration-14-konzentration-812d1aafa58a822e.webp",
                        "alt": "Inspiration des Tages: Konzentration"
            },
            {
                        "image": "/arcanum-inspiration-15-hoffnung-690e2d92b9a29c16.webp",
                        "alt": "Inspiration des Tages: Hoffnung"
            },
            {
                        "image": "/arcanum-inspiration-16-zielstrebigkeit-b79f702a4d2e6111.webp",
                        "alt": "Inspiration des Tages: Zielstrebigkeit"
            },
            {
                        "image": "/arcanum-inspiration-17-freundschaft-01870f9f1f7bf95d.webp",
                        "alt": "Inspiration des Tages: Freundschaft"
            },
            {
                        "image": "/arcanum-inspiration-18-achtsamkeit-91c2d3a9cab09331.webp",
                        "alt": "Inspiration des Tages: Achtsamkeit"
            },
            {
                        "image": "/arcanum-inspiration-19-ausprobieren-e26069a70fa83edc.webp",
                        "alt": "Inspiration des Tages: Ausprobieren"
            },
            {
                        "image": "/arcanum-inspiration-20-gemeinschaft-645863d2c42081c0.webp",
                        "alt": "Inspiration des Tages: Gemeinschaft"
            },
            {
                        "image": "/arcanum-inspiration-21-lernen-weiter-66495461876a48e3.webp",
                        "alt": "Inspiration des Tages: Lernen"
            },
            {
                        "image": "/arcanum-inspiration-22-team-78d41540304c6999.webp",
                        "alt": "Inspiration des Tages: Team"
            },
            {
                        "image": "/arcanum-inspiration-23-durchhalten-ed9c17502eea474c.webp",
                        "alt": "Inspiration des Tages: Durchhalten"
            },
            {
                        "image": "/arcanum-inspiration-24-an-dich-glauben-362d1d14fb78ad55.webp",
                        "alt": "Inspiration des Tages: An dich glauben"
            },
            {
                        "image": "/arcanum-inspiration-25-aus-fehlern-lernen-a103fdf14cabde31.webp",
                        "alt": "Inspiration des Tages: Aus Fehlern lernen"
            },
            {
                        "image": "/arcanum-inspiration-26-neugier-ideen-6068bdab99f814c2.webp",
                        "alt": "Inspiration des Tages: Neugier"
            },
            {
                        "image": "/arcanum-inspiration-27-ideen-teilen-b8d346d021d7c5c4.webp",
                        "alt": "Inspiration des Tages: Ideen teilen"
            },
            {
                        "image": "/arcanum-inspiration-28-nicht-aufgeben-d7991689c52db202.webp",
                        "alt": "Inspiration des Tages: Nicht aufgeben"
            },
            {
                        "image": "/arcanum-inspiration-29-ziele-65a44584b12943e7.webp",
                        "alt": "Inspiration des Tages: Ziele"
            },
            {
                        "image": "/arcanum-inspiration-30-achtsamkeit-offene-sinne-5749367e4be785cf.webp",
                        "alt": "Inspiration des Tages: Achtsamkeit"
            }
];

        const quoteCardImage =
            document.getElementById("quoteCardImage");

        let previousInspirationIndex = -1;

        try {
            previousInspirationIndex = Number(
                sessionStorage.getItem(
                    "arcanumInspirationCardIndex"
                )
            );
        } catch (error) {
            previousInspirationIndex = -1;
        }

        let selectedInspirationIndex;

        do {
            selectedInspirationIndex = Math.floor(
                Math.random() * inspirationCards.length
            );
        } while (
            inspirationCards.length > 1
            && selectedInspirationIndex
                === previousInspirationIndex
        );

        try {
            sessionStorage.setItem(
                "arcanumInspirationCardIndex",
                String(selectedInspirationIndex)
            );
        } catch (error) {
            // Funktioniert auch ohne Session-Speicher.
        }

        const selectedInspiration =
            inspirationCards[selectedInspirationIndex];

        quoteCardImage.src = selectedInspiration.image;
        quoteCardImage.alt = selectedInspiration.alt;

        const form = document.getElementById("loginForm");
        const statusBox = document.getElementById("loginStatus");
        const submitButton = document.getElementById("submitButton");
        const nextInput = document.getElementById("next");
        const queryNext = new URLSearchParams(window.location.search).get("next");
        if (queryNext) {
            const validatedNext = safeNext(queryNext);
            if (validatedNext !== null) {
                nextInput.value = validatedNext;
                nextInput.disabled = false;
            }
        }

        function safeNext(value) {
            return typeof value === "string"
                && value.length <= 2048
                && !/[\r\n\\]/.test(value)
                && value.startsWith("/")
                && !value.startsWith("//")
                && !/^\/https?:/i.test(value)
                ? value
                : null;
        }

        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            statusBox.textContent = "";
            statusBox.className = "login-status";
            submitButton.disabled = true;

            try {
                const formData = new FormData(form);

                const response = await fetch("/login", {
                    method: "POST",
                    body: new URLSearchParams(formData),
                    credentials: "include"
                });

                if (response.ok) {
                    statusBox.textContent = "Anmeldung erfolgreich – du wirst weitergeleitet.";
                    statusBox.classList.add("is-success");
                    window.location.href = safeNext(nextInput.value) || "/dashboard";
                    return;
                }

                statusBox.textContent = "Benutzername oder Passwort ist nicht korrekt.";
            } catch (error) {
                statusBox.textContent = "Die Anmeldung konnte gerade nicht durchgeführt werden.";
            } finally {
                submitButton.disabled = false;
            }
        });
