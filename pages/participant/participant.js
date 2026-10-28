/* ==================================================
   Participant helpers
================================================== */

function participantEscape(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function participantDateKey(date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}

/* ==================================================
   Challenge-specific progress calculations
================================================== */

function participantMetrics(record, challenge) {
    record = record || {};

    const november =
        challenge.challenge_key === "turkey-trot-2026-11";

    if (!november) {
        const count =
            getCompletedActivityCount(record.progress);

        const percentage = challenge.total_activities
            ? Math.round(
                count / challenge.total_activities * 100
            )
            : 0;

        return {
            november,
            count,
            percentage,
            status: getParticipantStatus(record, percentage)
        };
    }

    let steps = 0;
    let feathers = 0;
    let minis = 0;
    let logged = 0;

    const today = participantDateKey(new Date());
    const days = [];

    for (
        let day = 1;
        day <= Number(challenge.total_days || 30);
        day++
    ) {
        const date = new Date(
            `${challenge.start_date}T12:00:00`
        );

        date.setDate(date.getDate() + day - 1);

        const available =
            participantDateKey(date) <= today;

        const entry = record.progress?.[day];

        const valid =
            available &&
            Number.isSafeInteger(entry?.steps) &&
            entry.steps >= 0;

        const value = valid ? entry.steps : null;
        const wednesday = date.getDay() === 3;

        const mini =
            available &&
            wednesday &&
            entry?.tasks?.mini_challenge === true;

        if (valid) {
            steps += value;
            logged++;
        }

        if (valid && value >= 10000) {
            feathers++;
        }

        if (mini) {
            minis++;
        }

        days.push({
            date,
            available,
            value,
            wednesday,
            mini
        });
    }

    const percentage = Math.min(
        100,
        Math.floor(steps / 300000 * 100)
    );

    const status = steps >= 300000
        ? "Completed"
        : logged || minis
            ? "In Progress"
            : "Not Started";

    return {
        november,
        steps,
        feathers,
        minis,
        logged,
        days,
        percentage,
        status
    };
}

/* ==================================================
   Initialize participant page
================================================== */

async function initializeParticipantPage() {
    const session = await requireAuth();

    if (!session) {
        return;
    }

    initializeLogout();

    const params = new URLSearchParams(
        window.location.search
    );

    const participantId = params.get("id");
    const challengeId = params.get("challenge");

    if (!participantId) {
        showParticipantError(
            "Participant information is missing."
        );
        return;
    }

    if (challengeId) {
        const backLink = document.getElementById(
            "challenge-back-link"
        );

        if (backLink) {
            backLink.href =
                "../challenge/challenge.html" +
                `?id=${encodeURIComponent(challengeId)}`;
        }

        await loadParticipantDetails(
            participantId,
            challengeId
        );
    } else {
        await loadParticipantFromDirectory(
            participantId
        );
    }
}

/* ==================================================
   Logout and errors
================================================== */

function initializeLogout() {
    document.getElementById("logout-button")
        ?.addEventListener("click", () => {
            signOutAdmin();
        });
}

function showParticipantError(message) {
    const element = document.getElementById(
        "participant-email"
    );

    if (element) {
        element.textContent = message;
    }
}

/* ==================================================
   Load participant
================================================== */

async function loadParticipantDetails(
    participantId,
    challengeId
) {
    try {
        const [
            participant,
            challenge,
            challenges,
            history
        ] = await Promise.all([
            getParticipantById(participantId),
            getChallengeById(challengeId),
            getChallenges(),
            getParticipantHistory(participantId)
        ]);

        const record =
            await getParticipantChallengeProgress(
                participantId,
                challenge.challenge_key
            );

        renderParticipantDetails(
            participant,
            challenge,
            record
        );

        renderParticipationHistory(
            history,
            challenges
        );
    } catch (error) {
        console.error(
            "Participant detail load failed:",
            error
        );

        showParticipantError(
            "Unable to load participant."
        );
    }
}

async function loadParticipantFromDirectory(
    participantId
) {
    try {
        const [
            participant,
            challenges,
            history
        ] = await Promise.all([
            getParticipantById(participantId),
            getChallenges(),
            getParticipantHistory(participantId)
        ]);

        if (!history.length) {
            showParticipantError(
                "No challenge history found for this participant."
            );
            return;
        }

        const record = [...history].sort(
            (a, b) =>
                new Date(b.started_at || 0).getTime() -
                new Date(a.started_at || 0).getTime()
        )[0];

        const challenge = challenges.find(
            item =>
                item.challenge_key === record.challenge_key
        );

        if (!challenge) {
            showParticipantError(
                "Unable to find this participant's challenge."
            );
            return;
        }

        renderParticipantDetails(
            participant,
            challenge,
            record
        );

        renderParticipationHistory(
            history,
            challenges
        );

        setDirectoryBackLink();
    } catch (error) {
        console.error(
            "Unable to load participant from directory:",
            error
        );

        showParticipantError(
            "Unable to load participant."
        );
    }
}

function setDirectoryBackLink() {
    const link = document.getElementById(
        "challenge-back-link"
    );

    if (link) {
        link.href =
            "../participants/participants.html";

        link.textContent =
            "← Back to Participants";
    }
}

/* ==================================================
   Participant summary
================================================== */

function renderParticipantDetails(
    participant,
    challenge,
    progressRecord
) {
    const record = progressRecord || {};

    const metrics = participantMetrics(
        record,
        challenge
    );

    const setText = (id, value) => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    };

    setText("participant-email", participant.email);
    setText("participant-challenge", challenge.name);
    setText("participant-status", metrics.status);

    setText(
        "participant-percentage",
        `${metrics.percentage}%`
    );

    setText(
        "participant-started",
        formatParticipantDate(record.started_at)
    );

    const activities = document.getElementById(
        "participant-activities"
    );

    const card = activities?.closest(".summary-card");

    const label = card?.querySelector(
        ".summary-card__label"
    );

    const support = card?.querySelector(
        ".summary-card__support"
    );

    if (label) {
        label.textContent = metrics.november
            ? "Monthly Steps"
            : "Activities";
    }

    if (support) {
        support.textContent = metrics.november
            ? "Goal: 300,000 steps"
            : "Completed";
    }

    setText(
        "participant-activities",
        metrics.november
            ? metrics.steps.toLocaleString("en-US")
            : `${metrics.count} / ${challenge.total_activities}`
    );

    const section = document.querySelector(
        ".participant-progress-section"
    );

    const oldPanel = section?.querySelector(
        ".progress-map-panel"
    );

    const title = section?.querySelector(
        ".section-heading__title"
    );

    document.getElementById(
        "november-admin-progress"
    )?.remove();

    if (oldPanel) {
        oldPanel.style.display =
            metrics.november ? "none" : "";
    }

    if (title) {
        title.textContent = metrics.november
            ? "November Step Progress"
            : "30-Day Activity Map";
    }

    if (metrics.november) {
        renderNovemberProgress(
            section,
            metrics,
            challenge
        );
    } else {
        renderProgressMap(
            record.progress,
            challenge.total_days
        );
    }
}

/* ==================================================
   November step log
================================================== */

function renderNovemberProgress(section, metrics, challenge) {
    if (!section) {
        return;
    }

    const fraction = Math.min(
        Math.max(metrics.steps / 300000, 0),
        1
    );

    const panel = document.createElement("div");

    panel.id = "november-admin-progress";

    panel.style.cssText = `
        padding: 24px;
        border: 1px solid #e2d3bd;
        border-radius: 20px;
        background: #fffaf2;
        color: #382b20;
    `;

    const trackPath = `
        M 400 330
        H 220
        A 130 130 0 0 1 220 70
        H 580
        A 130 130 0 0 1 580 330
        H 400
    `;

    panel.innerHTML = `
        <div
            style="
                display: flex;
                flex-wrap: wrap;
                gap: 20px 32px;
                margin-bottom: 12px;
            "
        >
            <div>
                <strong>${metrics.feathers} / 30</strong>
                <span> feathers earned</span>
            </div>

            <div>
                <strong>${metrics.minis} / 4</strong>
                <span> Wednesday challenges</span>
            </div>

            <div>
                <strong>${metrics.logged}</strong>
                <span> days logged</span>
            </div>
        </div>

        <svg
            viewBox="0 0 800 390"
            role="img"
            aria-label="
                ${metrics.steps} of 300000 steps.
                ${metrics.percentage}% complete.
            "
            style="
                display: block;
                width: 100%;
                max-width: 760px;
                height: auto;
                margin: 0 auto;
            "
        >
            <rect
                x="120"
                y="98"
                width="560"
                height="204"
                rx="102"
                fill="#f8efd9"
            />

            <path
                data-admin-track
                d="${trackPath}"
                fill="none"
                stroke="#e3d3b6"
                stroke-width="32"
            />

            <path
                d="${trackPath}"
                pathLength="100"
                fill="none"
                stroke="#b85d32"
                stroke-width="32"
                stroke-linecap="round"
                stroke-dasharray="100"
                stroke-dashoffset="${100 - fraction * 100}"
                opacity="${fraction > 0 ? 1 : 0}"
            />

            <path
                d="M400 310V350"
                stroke="#65462c"
                stroke-width="4"
            />

            <text
                x="400"
                y="151"
                text-anchor="middle"
                fill="#795335"
                font-family="Arial, sans-serif"
                font-size="17"
                letter-spacing="3"
            >
                NOVEMBER STEPS
            </text>

            <text
                x="400"
                y="211"
                text-anchor="middle"
                fill="#49321f"
                font-family="Georgia, serif"
                font-size="58"
            >
                ${metrics.steps.toLocaleString("en-US")}
            </text>

            <text
                x="400"
                y="249"
                text-anchor="middle"
                fill="#795335"
                font-family="Arial, sans-serif"
                font-size="22"
            >
                of 300,000
            </text>

            <text
                x="400"
                y="282"
                text-anchor="middle"
                fill="#a34c2b"
                font-family="Arial, sans-serif"
                font-size="20"
                font-weight="700"
            >
                ${metrics.percentage}% complete
            </text>

            <g
                data-admin-turkey
                transform="translate(400 330)"
                aria-hidden="true"
            >
                <circle
                    r="29"
                    fill="#fffaf2"
                    stroke="#c6a56e"
                    stroke-width="2"
                />

                <g stroke="#75452e" stroke-width="1">
                    <ellipse
                        cx="0" cy="-9" rx="6" ry="16"
                        fill="#bd572b"
                    />
                    <ellipse
                        cx="0" cy="-9" rx="6" ry="16"
                        fill="#d5a32a"
                        transform="rotate(-35)"
                    />
                    <ellipse
                        cx="0" cy="-9" rx="6" ry="16"
                        fill="#69764b"
                        transform="rotate(-65)"
                    />
                    <ellipse
                        cx="0" cy="-9" rx="6" ry="16"
                        fill="#d5a32a"
                        transform="rotate(35)"
                    />
                    <ellipse
                        cx="0" cy="-9" rx="6" ry="16"
                        fill="#913e51"
                        transform="rotate(65)"
                    />
                </g>

                <ellipse
                    cx="0" cy="7" rx="12" ry="14"
                    fill="#70432d"
                />

                <circle cx="7" cy="-5" r="8" fill="#bb7848"/>

                <path d="M14-6l8 4-8 3" fill="#e8b343"/>

                <circle cx="10" cy="-7" r="1.5" fill="#30261c"/>

                <path
                    d="M-5 19v5m10-5v5"
                    stroke="#a6652e"
                    stroke-width="3"
                    stroke-linecap="round"
                />
            </g>

            <text
                x="400"
                y="378"
                text-anchor="middle"
                fill="#795335"
                font-family="Arial, sans-serif"
                font-size="13"
                letter-spacing="2"
            >
                START / FINISH
            </text>
        </svg>
    `;

    section.appendChild(panel);

    const path = panel.querySelector("[data-admin-track]");

    const point = path.getPointAtLength(
        path.getTotalLength() * fraction
    );

    panel.querySelector("[data-admin-turkey]").setAttribute(
        "transform",
        `translate(${point.x} ${point.y})`
    );
}
/* ==================================================
   September activity heatmap
================================================== */

function renderProgressMap(progress, totalDays) {
    const map = document.getElementById(
        "progress-map"
    );

    if (!map) {
        return;
    }

    let completedDays = 0;
    let restDayCount = 0;

    const days = [];

    for (let day = 1; day <= totalDays; day++) {
        const entries = Object.entries(
            progress?.[day]?.tasks ?? {}
        );

        let state = "is-empty";
        let title = `Day ${day}: Not started`;

        if (!entries.length) {
            state = "is-rest";
            title = `Day ${day}: Rest day`;
            restDayCount++;
        } else {
            const count = entries.filter(
                ([, complete]) => complete === true
            ).length;

            if (count === entries.length) {
                state = "is-complete";
                title = `Day ${day}: Complete`;
                completedDays++;
            } else if (count > 0) {
                state = "is-partial";

                title =
                    `Day ${day}: ` +
                    `${count}/${entries.length} complete`;
            }
        }

        days.push(`
            <div
                class="progress-map__day ${state}"
                title="${title}"
            >
                ${day}
            </div>
        `);
    }

    map.innerHTML = days.join("");

    const active = document.getElementById(
        "active-days-completed"
    );

    const rest = document.getElementById(
        "rest-days"
    );

    if (active) {
        active.textContent = completedDays;
    }

    if (rest) {
        rest.textContent = restDayCount;
    }
}

/* ==================================================
   Activity calculations
================================================== */

function getCompletedActivityCount(progress) {
    if (!progress || typeof progress !== "object") {
        return 0;
    }

    let count = 0;

    Object.values(progress).forEach(day => {
        const tasks = day?.tasks;

        if (!tasks || typeof tasks !== "object") {
            return;
        }

        Object.values(tasks).forEach(complete => {
            if (complete === true) {
                count++;
            }
        });
    });

    return count;
}

function getParticipantStatus(record, percentage) {
    if (record.completed_at || percentage >= 100) {
        return "Completed";
    }

    return percentage > 0
        ? "In Progress"
        : "Not Started";
}

/* ==================================================
   Participation history
================================================== */

function renderParticipationHistory(
    history,
    challenges
) {
    const total = document.getElementById(
        "history-total"
    );

    const complete = document.getElementById(
        "history-completed"
    );

    const list = document.getElementById(
        "history-list"
    );

    if (total) {
        total.textContent = history.length;
    }

    if (complete) {
        complete.textContent = history.filter(record => {
            const challenge = challenges.find(
                item =>
                    item.challenge_key ===
                    record.challenge_key
            );

            return challenge &&
                participantMetrics(
                    record,
                    challenge
                ).status === "Completed";
        }).length;
    }

    if (!list) {
        return;
    }

    list.innerHTML = history.length
        ? history.map(record =>
            createHistoryRow(record, challenges)
        ).join("")
        : `
            <p class="history-list__loading">
                No challenge history found.
            </p>
        `;
}

function createHistoryRow(record, challenges) {
    const challenge = challenges.find(
        item =>
            item.challenge_key === record.challenge_key
    );

    if (!challenge) {
        return "";
    }

    const metrics = participantMetrics(
        record,
        challenge
    );

    const detail = metrics.november
        ? `
            <p class="history-row__date">
                ${metrics.steps.toLocaleString("en-US")}
                / 300,000 steps
            </p>
        `
        : "";

    return `
        <div class="history-row">
            <div>
                <p class="history-row__challenge">
                    ${participantEscape(challenge.name)}
                </p>

                <p class="history-row__date">
                    ${
                        participantEscape(
                            formatParticipantDate(
                                record.started_at
                            )
                        )
                    }
                </p>

                ${detail}
            </div>

            <div class="history-row__progress">
                ${metrics.percentage}%
            </div>

            <span class="history-row__status">
                ${metrics.status}
            </span>
        </div>
    `;
}

/* ==================================================
   Date formatting
================================================== */

function formatParticipantDate(value) {
    if (!value) {
        return "Not started";
    }

    return new Date(value).toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );
}

/* ==================================================
   Start
================================================== */

initializeParticipantPage();