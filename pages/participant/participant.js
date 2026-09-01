/* ==================================================
   Participant Detail
================================================== */

async function initializeParticipantPage() {

    const session =
        await requireAuth();

    if (!session) {
        return;
    }

    initializeLogout();

    const params =
        new URLSearchParams(
            window.location.search
        );

    const participantId =
        params.get("id");

    const challengeId =
        params.get("challenge");

    if (!participantId) {

        showParticipantError(
            "Participant information is missing."
        );

        return;
    }


    if (challengeId) {

        const backLink =
            document.getElementById(
                "challenge-back-link"
            );

        if (backLink) {

            backLink.href =
                `../challenge/challenge.html?id=${challengeId}`;

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
   Error
================================================== */

function showParticipantError(
    message
) {

    const participantEmail =
        document.getElementById(
            "participant-email"
        );

    if (participantEmail) {

        participantEmail.textContent =
            message;

    }
}

/* ==================================================
   Initialize
================================================== */

initializeParticipantPage();

/* ==================================================
   Load Participant Details
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
        ] =
            await Promise.all([
                getParticipantById(
                    participantId
                ),
                getChallengeById(
                    challengeId
                ),
                getChallenges(),
                getParticipantHistory(
                    participantId
                )
            ]);


        const progressRecord =
            await getParticipantChallengeProgress(
                participantId,
                challenge.challenge_key
            );


        renderParticipantDetails(
            participant,
            challenge,
            progressRecord
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
        ] =
            await Promise.all([
                getParticipantById(
                    participantId
                ),
                getChallenges(),
                getParticipantHistory(
                    participantId
                )
            ]);


        if (!history.length) {

            showParticipantError(
                "No challenge history found for this participant."
            );

            return;
        }


        const sortedHistory =
            [...history].sort(
                (a, b) => {

                    const dateA =
                        new Date(
                            a.started_at ||
                            0
                        );

                    const dateB =
                        new Date(
                            b.started_at ||
                            0
                        );

                    return (
                        dateB.getTime() -
                        dateA.getTime()
                    );

                }
            );


        const latestProgress =
            sortedHistory[0];


        const challenge =
            challenges.find(
                (item) =>
                    item.challenge_key ===
                    latestProgress.challenge_key
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
            latestProgress
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

    const backLink =
        document.getElementById(
            "challenge-back-link"
        );

    if (!backLink) {
        return;
    }

    backLink.href =
        "../participants/participants.html";

    backLink.textContent =
        "← Back to Participants";
}
/* ==================================================
   Render Participant
================================================== */

function renderParticipantDetails(
    participant,
    challenge,
    progressRecord
) {

    const email =  document.getElementById( "participant-email");
    const challengeName = document.getElementById("participant-challenge");
    const status = document.getElementById("participant-status");
    const percentage = document.getElementById("participant-percentage");
    const activities = document.getElementById("participant-activities");
    const started = document.getElementById("participant-started");
    const completedCount = getCompletedActivityCount(progressRecord.progress);
    const progressPercentage = 
        challenge.total_activities
            ? Math.round(
                (
                    completedCount /
                    challenge.total_activities
                ) * 100
            )
            : 0;
    if (email) {
        email.textContent =
            participant.email;
    }
    if (challengeName) {

        challengeName.textContent =
            challenge.name;
    }

    if (status) {

        status.textContent =
            getParticipantStatus(
                progressRecord,
                progressPercentage
            );
    }

    if (percentage) {

        percentage.textContent =
            `${progressPercentage}%`;
    }

    if (activities) {

        activities.textContent =
            `${completedCount} / ${challenge.total_activities}`;

    }


    if (started) {

        started.textContent =
            formatParticipantDate(
                progressRecord.started_at
            );

    }
   renderProgressMap(
        progressRecord.progress,
        challenge.total_days
    );
}

/* ==================================================
   Progress Map
================================================== */

function renderProgressMap(
    progress,
    totalDays
) {

    const progressMap =
        document.getElementById(
            "progress-map"
        );

    const activeDaysCompleted =
        document.getElementById(
            "active-days-completed"
        );

    const restDays =
        document.getElementById(
            "rest-days"
        );

    if (!progressMap) {
        return;
    }

    let completedDays = 0;
    let restDayCount = 0;

    const days = [];

    for (
        let dayNumber = 1;
        dayNumber <= totalDays;
        dayNumber += 1
    ) {

        const dayData =
            progress?.[dayNumber] ?? {};

        const tasks =
            dayData?.tasks ?? {};

        const taskEntries =
            Object.entries(
                tasks
            );

        let state =
            "is-empty";

        let title =
            `Day ${dayNumber}: Not started`;


        if (!taskEntries.length) {

            state =
                "is-rest";

            title =
                `Day ${dayNumber}: Rest day`;

            restDayCount += 1;

        } else {

            const completedTasks =
                taskEntries.filter(
                    ([, complete]) =>
                        complete === true
                ).length;


            if (
                completedTasks ===
                taskEntries.length
            ) {

                state =
                    "is-complete";

                title =
                    `Day ${dayNumber}: Complete`;

                completedDays += 1;

            } else if (
                completedTasks > 0
            ) {

                state =
                    "is-partial";

                title =
                    `Day ${dayNumber}: ${completedTasks}/${taskEntries.length} complete`;

            }

        }


        days.push(`
            <div
                class="progress-map__day ${state}"
                title="${title}"
            >
                ${dayNumber}
            </div>
        `);

    }


    progressMap.innerHTML =
        days.join("");


    if (activeDaysCompleted) {

        activeDaysCompleted.textContent =
            completedDays;

    }


    if (restDays) {

        restDays.textContent =
            restDayCount;

    }
}
/* ==================================================
   Completed Activities
================================================== */

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

            if (
                !tasks ||
                typeof tasks !== "object"
            ) {
                return;
            }

            Object.values(
                tasks
            ).forEach(
                (isComplete) => {

                    if (
                        isComplete === true
                    ) {
                        completedCount += 1;
                    }

                }
            );

        }
    );

    return completedCount;
}

/* ==================================================
   Participant Status
================================================== */

function getParticipantStatus(
    progressRecord,
    percentage
) {

    if (
        progressRecord.completed_at ||
        percentage >= 100
    ) {
        return "Completed";
    }

    if (percentage > 0) {
        return "In Progress";
    }

    return "Not Started";
}

/* ==================================================
   Participation History
================================================== */

function renderParticipationHistory(
    history,
    challenges
) {

    const historyTotal =
        document.getElementById(
            "history-total"
        );

    const historyCompleted =
        document.getElementById(
            "history-completed"
        );

    const historyList =
        document.getElementById(
            "history-list"
        );


    const completedCount =
        history.filter(
            (record) => {

                const challenge =
                    challenges.find(
                        (item) =>
                            item.challenge_key ===
                            record.challenge_key
                    );

                if (!challenge) {
                    return false;
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

                return (
                    record.completed_at ||
                    percentage >= 100
                );

            }
        ).length;


    if (historyTotal) {

        historyTotal.textContent =
            history.length;

    }


    if (historyCompleted) {

        historyCompleted.textContent =
            completedCount;

    }


    if (!historyList) {
        return;
    }


    if (!history.length) {

        historyList.innerHTML = `
            <p class="history-list__loading">
                No challenge history found.
            </p>
        `;

        return;
    }


    historyList.innerHTML =
        history
            .map(
                (record) =>
                    createHistoryRow(
                        record,
                        challenges
                    )
            )
            .join("");
}

function createHistoryRow(
    record,
    challenges
) {

    const challenge =
        challenges.find(
            (item) =>
                item.challenge_key ===
                record.challenge_key
        );


    if (!challenge) {

        return "";

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


    const status =
        getParticipantStatus(
            record,
            percentage
        );


    return `
        <div class="history-row">

            <div>

                <p class="history-row__challenge">
                    ${challenge.name}
                </p>

                <p class="history-row__date">
                    ${formatParticipantDate(
                        record.started_at
                    )}
                </p>

            </div>

            <div class="history-row__progress">
                ${percentage}%
            </div>

            <span class="history-row__status">
                ${status}
            </span>

        </div>
    `;
}
/* ==================================================
   Date Formatting
================================================== */

function formatParticipantDate(
    dateValue
) {

    if (!dateValue) {
        return "Not started";
    }

    const date =
        new Date(
            dateValue
        );

    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );
}