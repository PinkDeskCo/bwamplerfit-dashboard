console.log ('v1 complete')

/* ==================================================
   Dashboard
================================================== */
async function initializeDashboard() {

    const session =
        await requireAuth();

    if (!session) {
        return;
    }

    renderAdminSidebar(
        "dashboard"
    );
    initializeLogout();

    await loadChallenges();
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
   Challenges
================================================== */
async function loadChallenges() {

    const challengeGrid =
        document.getElementById(
            "challenge-grid"
        );

    try {

        const [
            challenges,
            participantData
        ] =
            await Promise.all([
                getChallenges(),
                getChallengeParticipantData()
            ]);

        renderChallengeSummary(
            challenges,
            participantData
        );

        renderChallengeCards(
            challenges,
            participantData,
            challengeGrid
        );

    } catch (error) {

        console.error(
            "Dashboard challenge load failed:",
            error
        );

        if (challengeGrid) {

            challengeGrid.innerHTML = `
                <p class="challenge-grid__loading">
                    Unable to load challenges.
                </p>
            `;

        }

    }
}

/* ==================================================
   Summary
================================================== */
function renderChallengeSummary(
    challenges,
    participantData
) {

    const totalChallenges =
        document.getElementById(
            "total-challenges"
        );

    const activeChallenges =
        document.getElementById(
            "active-challenges"
        );

    const totalParticipants =
        document.getElementById(
            "total-participants"
        );

    const today =
        new Date();

    const activeCount =
        challenges.filter(
            (challenge) => {

                const startDate =
                    new Date(
                        challenge.start_date
                    );

                const endDate =
                    new Date(
                        challenge.end_date
                    );

                return (
                    today >= startDate &&
                    today <= endDate
                );

            }
        ).length;


    const uniqueParticipants =
        new Set(
            participantData
                .map(
                    (record) =>
                        record.participant_id
                )
                .filter(Boolean)
        );


    if (totalChallenges) {

        totalChallenges.textContent =
            challenges.length;

    }

    if (activeChallenges) {

        activeChallenges.textContent =
            activeCount;

    }

    if (totalParticipants) {

        totalParticipants.textContent =
            uniqueParticipants.size;

    }
}

/* ==================================================
   Challenge Cards
================================================== */
function renderChallengeCards(
    challenges,
    participantData,
    challengeGrid
) {

    if (!challengeGrid) {
        return;
    }

    if (!challenges.length) {

        challengeGrid.innerHTML = `
            <p class="challenge-grid__loading">
                No challenges found.
            </p>
        `;

        return;
    }

    challengeGrid.innerHTML =
        challenges
            .map(
                (challenge) => {

                    const participantCount =
                        getChallengeParticipantCount(
                            challenge.challenge_key,
                            participantData
                        );

                    return createChallengeCard(
                        challenge,
                        participantCount
                    );

                }
            )
            .join("");
}
function getChallengeParticipantCount(
    challengeKey,
    participantData
) {

    const participantIds =
        participantData
            .filter(
                (record) =>
                    record.challenge_key ===
                    challengeKey
            )
            .map(
                (record) =>
                    record.participant_id
            )
            .filter(Boolean);

    return new Set(
        participantIds
    ).size;
}

/* ==================================================
   Challenge Card
================================================== */
function createChallengeCard(
    challenge,
    participantCount
) {

    const status =
        getChallengeStatus(
            challenge
        );


    return `
        <article
            class="
                challenge-card
                challenge-card--${challenge.challenge_key}
            "
        >

            <div class="challenge-card__art">

                <img
                    src="../../assets/images/strong-mom-hero.PNG"
                    alt=""
                    class="challenge-card__image"
                >

            </div>

            <div class="challenge-card__content">

                <span
                    class="
                        challenge-card__status
                        challenge-card__status--${status.toLowerCase()}
                    "
                >
                    ${status}
                </span>

                <div class="challenge-card__heading">

                    <p class="challenge-card__eyebrow">
                        September 1–30
                    </p>

                    <h3 class="challenge-card__title">
                        ${challenge.name}
                    </h3>

                </div>

                <p class="challenge-card__meta">
                    ${challenge.total_days}-Day Challenge
                    ·
                    ${challenge.total_activities} Activities
                </p>

                <div class="challenge-card__footer">

                    <span class="challenge-card__participants">
                        ${participantCount}
                        ${participantCount === 1
                            ? "Participant"
                            : "Participants"}
                    </span>

                    <a
                        href="../challenge/challenge.html?id=${challenge.id}"
                        class="challenge-card__link"
                    >
                        View Challenge →
                    </a>

                </div>

            </div>

        </article>
    `;
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
            challenge.start_date
        );

    const endDate =
        new Date(
            challenge.end_date
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
   Initialize
================================================== */

initializeDashboard();