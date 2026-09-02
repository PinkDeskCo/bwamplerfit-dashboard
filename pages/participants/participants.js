
console.log("2ndmedia900")
/* ==================================================
   Participants Directory
================================================== */
let participantDirectory = [];
let activeParticipantFilter = "all";


/* ==================================================
   Initialize
================================================== */
async function initializeParticipantsPage() {

    const session =
        await requireAuth();

    if (!session) {
        return;
    }

    renderAdminSidebar(
        "participants"
    );

    initializeLogout();

    initializeSearch();

    initializeFilters();

    await loadParticipants();
}

/* ==================================================
   Filters
================================================== */
function initializeFilters() {

    const filterButtons =
        document.querySelectorAll(
            ".participant-filter"
        );

    if (!filterButtons.length) {
        return;
    }


    filterButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    activeParticipantFilter =
                        button.dataset.filter;

                    filterButtons.forEach(
                        (item) => {
                            item.classList.remove(
                                "is-active"
                            );
                        }
                    );

                    button.classList.add(
                        "is-active"
                    );

                    applyParticipantFilters();

                }
            );

        }
    );
}
function applyParticipantFilters() {

    const searchInput =
        document.getElementById(
            "participant-search"
        );

    const searchTerm =
        searchInput
            ?.value
            .trim()
            .toLowerCase() ?? "";


    let filtered =
        participantDirectory.filter(
            (participant) =>
                participant.email
                    .toLowerCase()
                    .includes(
                        searchTerm
                    )
        );

    if (
            activeParticipantFilter ===
            "current"
        ) {

            filtered =
                filtered.filter(
                    (participant) =>
                        participant.isCurrent
                );

        }


        if (
            activeParticipantFilter ===
            "past"
        ) {

            filtered =
                filtered.filter(
                    (participant) =>
                        !participant.isCurrent &&
                        participant.challengeCount > 0
                );

        }    

    if (
        activeParticipantFilter ===
        "repeat"
    ) {

        filtered =
            filtered.filter(
                (participant) =>
                    participant.challengeCount >= 2
            );

    }


    if (
        activeParticipantFilter ===
        "finisher"
    ) {

        filtered =
            filtered.filter(
                (participant) =>
                    participant.completedCount >= 1
            );

    }


    if (
        activeParticipantFilter ===
        "multi-finisher"
    ) {

        filtered =
            filtered.filter(
                (participant) =>
                    participant.completedCount >= 2
            );

    }


    renderParticipantDirectory(
        filtered
    );
}

/* ==================================================
   Logout
================================================== */
function initializeLogout() {

    const logoutButton =
        document.getElementById(
            "logout-button"
        );

    if (!logoutButton) {
        return;
    }

    logoutButton.addEventListener(
        "click",
        () => {
            signOutAdmin();
        }
    );
}

/* ==================================================
   Load Participants
================================================== */
async function loadParticipants() {

    try {

        const [
            participants,
            history,
            challenges
        ] =
            await Promise.all([
                getAllParticipants(),
                getAllParticipationHistory(),
                getChallenges()
            ]);


        participantDirectory =
            participants.map(
                (participant) =>
                    buildParticipantSummary(
                        participant,
                        history,
                        challenges
                    )
            );


        renderDirectorySummary(
            participantDirectory
        );

        renderParticipantDirectory(
            participantDirectory
        );

    } catch (error) {

        console.error(
            "Participant directory failed:",
            error
        );

        showDirectoryError();

    }
}

/* ==================================================
   Participant Summary
================================================== */
function buildParticipantSummary(
    participant,
    history,
    challenges
) {

    const records =
        history.filter(
            (record) =>
                record.participant_id ===
                participant.id
        );


    const latestChallenge =
        getLatestChallenge(
            challenges
        );


    const isCurrent =
        latestChallenge
            ? records.some(
                (record) =>
                    record.challenge_key ===
                    latestChallenge.challenge_key
            )
            : false;


    let completedCount = 0;


    records.forEach(
        (record) => {

            const challenge =
                challenges.find(
                    (item) =>
                        item.challenge_key ===
                        record.challenge_key
                );

            if (!challenge) {
                return;
            }


            const completedActivities =
                getCompletedActivityCount(
                    record.progress
                );


            const percentage =
                challenge.total_activities
                    ? Math.round(
                        (
                            completedActivities /
                            challenge.total_activities
                        ) * 100
                    )
                    : 0;


            if (
                record.completed_at ||
                percentage >= 100
            ) {

                completedCount += 1;

            }

        }
    );


    const dates =
        records
            .map(
                (record) =>
                    record.started_at
            )
            .filter(Boolean)
            .map(
                (date) =>
                    new Date(date)
            );


    const lastParticipated =
        dates.length
            ? new Date(
                Math.max(
                    ...dates.map(
                        (date) =>
                            date.getTime()
                    )
                )
            )
            : null;


    const labels =
        getParticipantLabels(
            records.length,
            completedCount,
            isCurrent
        );


    return {
        ...participant,

        challengeCount:
            records.length,

        completedCount,

        lastParticipated,

        labels,

        isCurrent
    };
}
function getLatestChallenge(
    challenges
) {

    if (!challenges?.length) {
        return null;
    }

    return [...challenges]
        .sort(
            (a, b) =>
                new Date(
                    b.start_date
                ).getTime() -
                new Date(
                    a.start_date
                ).getTime()
        )[0];
}
/* ==================================================
   Participant Labels
================================================== */

function getParticipantLabels(
    challengeCount,
    completedCount, 
    isCurrent
) {

    const labels = [];

    if (isCurrent) {

        labels.push({
            text: "Current",
            className: "is-current"
        });

    } else if (challengeCount > 0) {

        labels.push({
            text: "Past Participant",
            className: "is-past"
        });

    }

    if (challengeCount >= 2) {

        labels.push({
            text: "Repeat",
            className: "is-repeat"
        });

    } else {

        labels.push({
            text: "New",
            className: "is-new"
        });

    }


    if (completedCount >= 2) {

        labels.push({
            text: "Multi-Finisher",
            className: "is-multi-finisher"
        });

    } else if (completedCount === 1) {

        labels.push({
            text: "Finisher",
            className: "is-finisher"
        });

    }


    return labels;
}

function getCompletedActivityCount(
    progress
) {

    if (
        !progress ||
        typeof progress !== "object"
    ) {
        return 0;
    }

    let completedCount = 0;

    Object.values(
        progress
    ).forEach(
        (day) => {

            const tasks =
                day?.tasks;

            if (!tasks) {
                return;
            }

            Object.values(
                tasks
            ).forEach(
                (complete) => {

                    if (complete === true) {
                        completedCount += 1;
                    }

                }
            );

        }
    );

    return completedCount;
}

function renderDirectorySummary(
    participants
) {

    const total =
        document.getElementById(
            "total-participants"
        );

    const repeat =
        document.getElementById(
            "repeat-participants"
        );

    const completions =
        document.getElementById(
            "challenge-completions"
        );


    const repeatCount =
        participants.filter(
            (participant) =>
                participant.challengeCount > 1
        ).length;


    const completionCount =
        participants.reduce(
            (
                totalCount,
                participant
            ) =>
                totalCount +
                participant.completedCount,
            0
        );


    if (total) {

        total.textContent =
            participants.length;

    }


    if (repeat) {

        repeat.textContent =
            repeatCount;

    }


    if (completions) {

        completions.textContent =
            completionCount;

    }
}

function renderParticipantDirectory(
    participants
) {

    const tableBody =
        document.getElementById(
            "participants-table-body"
        );

    if (!tableBody) {
        return;
    }


    if (!participants.length) {

        tableBody.innerHTML = `
            <p class="participants-table__loading">
                No participants found.
            </p>
        `;

        return;
    }


    tableBody.innerHTML =
        participants
            .map(
                (participant) =>
                    createParticipantDirectoryRow(
                        participant
                    )
            )
            .join("");
}

function createParticipantDirectoryRow(
    participant
) {

    return `
        <div class="participants-row">

            <span class="participants-row__email">
                ${participant.email}
            </span>

            <div class="participants-row__labels">
                ${createParticipantLabels(
                    participant.labels
                )}
            </div>

            <span class="participants-row__number">
                ${participant.challengeCount}
            </span>

            <span class="participants-row__number">
                ${participant.completedCount}
            </span>

            <span class="participants-row__date">
                ${formatDirectoryDate(
                    participant.lastParticipated
                )}
            </span>

            <a
                href="../participant/participant.html?id=${participant.id}"
                class="participants-row__link"
            >
                View →
            </a>

        </div>
    `;
}
function createParticipantLabels(
    labels
) {

    if (!labels?.length) {
        return "";
    }


    return labels
        .map(
            (label) => `
                <span
                    class="
                        participant-label
                        ${label.className}
                    "
                >
                    ${label.text}
                </span>
            `
        )
        .join("");
}
function formatDirectoryDate(
    date
) {

    if (!date) {
        return "Never";
    }

    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );
}

function initializeSearch() {

    const searchInput =
        document.getElementById(
            "participant-search"
        );

    if (!searchInput) {
        return;
    }

    searchInput.addEventListener(
        "input",
        () => {

            applyParticipantFilters();

        }
    );
}


/* ==================================================
   Error
================================================== */
function showDirectoryError() {

    const tableBody =
        document.getElementById(
            "participants-table-body"
        );

    if (tableBody) {

        tableBody.innerHTML = `
            <p class="participants-table__loading">
                Unable to load participants.
            </p>
        `;

    }
}


initializeParticipantsPage();