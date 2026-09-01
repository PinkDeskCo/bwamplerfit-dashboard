/* ==================================================
   Challenge Detail
================================================== */

async function initializeChallengePage() {

    const session =
        await requireAuth();

    if (!session) {
        return;
    }

    renderAdminSidebar(
        "participants"
    );
    initializeLogout();

    const challengeId =
        getChallengeId();

    if (!challengeId) {

        showChallengeError(
            "No challenge ID was provided."
        );

        return;
    }

    await loadChallenge(
        challengeId
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
   Challenge ID
================================================== */

function getChallengeId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("id");
}


/* ==================================================
   Load Challenge
================================================== */

async function loadChallenge(
    challengeId
) {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("challenges")
                .select("*")
                .eq(
                    "id",
                    challengeId
                )
                .single();

        if (error) {
            throw error;
        }

        renderChallenge(
            data
        );
        await loadChallengeParticipants(
            data
        );

    } catch (error) {

        console.error(
            "Challenge load failed:",
            error
        );

        showChallengeError(
            "Unable to load this challenge."
        );

    }
}


/* ==================================================
   Render Challenge
================================================== */

function renderChallenge(
    challenge
) {

    const challengeName =
        document.getElementById(
            "challenge-name"
        );

    const challengeDates =
        document.getElementById(
            "challenge-dates"
        );

    const challengeStatus =
        document.getElementById(
            "challenge-status"
        );

    const challengeDays =
        document.getElementById(
            "challenge-days"
        );

    const challengeActivities =
        document.getElementById(
            "challenge-activities"
        );


    if (challengeName) {

        challengeName.textContent =
            challenge.name;

    }


    if (challengeDates) {

        challengeDates.textContent =
            `${formatDate(
                challenge.start_date
            )} - ${formatDate(
                challenge.end_date
            )}`;

    }


    if (challengeStatus) {

        challengeStatus.textContent =
            getChallengeStatus(
                challenge
            );

    }


    if (challengeDays) {

        challengeDays.textContent =
            challenge.total_days;

    }


    if (challengeActivities) {

        challengeActivities.textContent =
            challenge.total_activities;

    }

}
/* ==================================================
   Challenge Participants
================================================== */

async function loadChallengeParticipants(
    challenge
) {

    const tableBody =
        document.getElementById(
            "participant-table-body"
        );

    try {

        const progressRecords =
            await getChallengeProgress(
                challenge.challenge_key
            );

        renderParticipantCount(
            progressRecords
        );

        renderParticipants(
            progressRecords,
            challenge,
            tableBody
        );

    } catch (error) {

        console.error(
            "Participant load failed:",
            error
        );

        if (tableBody) {

            tableBody.innerHTML = `
                <p class="participant-table__loading">
                    Unable to load participants.
                </p>
            `;

        }

    }
}
function renderParticipantCount(
    progressRecords
) {

    const participantCount =
        document.getElementById(
            "challenge-participants"
        );

    if (!participantCount) {
        return;
    }

    const uniqueParticipants =
        new Set(
            progressRecords
                .map(
                    (record) =>
                        record.participant_id
                )
                .filter(Boolean)
        );

    participantCount.textContent =
        uniqueParticipants.size;
}
function renderParticipants(
    progressRecords,
    challenge,
    tableBody
) {

    if (!tableBody) {
        return;
    }

    if (!progressRecords.length) {

        tableBody.innerHTML = `
            <p class="participant-table__loading">
                No participants are enrolled
                in this challenge.
            </p>
        `;

        return;
    }

    tableBody.innerHTML =
        progressRecords
            .map(
                (record) =>
                    createParticipantRow(
                        record,
                        challenge
                    )
            )
            .join("");
}
function createParticipantRow(
    record,
    challenge
) {

    const participant =
        record.challenge_participants;

    const email =
        participant?.email ??
        "Unknown participant";

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
        <div class="participant-row">

            <div class="participant-row__person">

                <span class="participant-row__email">
                    ${email}
                </span>

            </div>

            <div class="participant-row__progress">

                <div class="progress-bar">

                    <span
                        class="progress-bar__fill"
                        style="width: ${percentage}%"
                    ></span>

                </div>

                <span class="participant-row__percentage">
                    ${percentage}%
                </span>

            </div>

            <div>

                <span class="participant-row__status">
                    ${status}
                </span>

            </div>

            <div class="participant-row__action">

                <a
                    href="../participant/participant.html?id=${record.participant_id}&challenge=${challenge.id}"
                    class="participant-row__link"
                >
                    View →
                </a>

            </div>

        </div>
    `;
}

/* ==================================================
   Date Formatting
================================================== */

function formatDate(
    dateValue
) {

    const date =
        new Date(
            `${dateValue}T00:00:00`
        );

    return date.toLocaleDateString(
        "en-US",
        {
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    );
}


/* ==================================================
   Challenge Status
================================================== */

function getChallengeStatus(
    challenge
) {

    const today =
        new Date();

    const startDate =
        new Date(
            `${challenge.start_date}T00:00:00`
        );

    const endDate =
        new Date(
            `${challenge.end_date}T23:59:59`
        );

    if (today < startDate) {
        return "Upcoming";
    }

    if (today > endDate) {
        return "Completed";
    }

    return "Active";
}

/* ==================================================
   Completed Activity Count
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
    record,
    percentage
) {

    if (
        record.completed_at ||
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
   Error
================================================== */

function showChallengeError(
    message
) {

    const challengeName =
        document.getElementById(
            "challenge-name"
        );

    if (challengeName) {
        challengeName.textContent =
            message;
    }

}


/* ==================================================
   Initialize
================================================== */

initializeChallengePage();