console.log ('mobile edit')

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
function createChallengeCard(challenge, participantCount) {
    const escapeHTML = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    const status = getChallengeStatus(challenge);

    const isTurkeyTrot =
        challenge.challenge_key === "turkey-trot-2026-11";

    const image = isTurkeyTrot
        ? "../../assets/images/turkey-trot-mascot.svg"
        : "../../assets/images/strong-mom-hero.PNG";

    const dateFormatter = new Intl.DateTimeFormat(
        "en-US",
        {
            month: "long",
            day: "numeric"
        }
    );

    const dates = dateFormatter.formatRange(
        new Date(`${challenge.start_date}T12:00:00`),
        new Date(`${challenge.end_date}T12:00:00`)
    );

    const description = isTurkeyTrot
        ? "10,000 Steps Daily · 300,000 Monthly Goal"
        : `${challenge.total_days}-Day Challenge · ` +
          `${challenge.total_activities} Activities`;

    const link =
        "../challenge/challenge.html" +
        `?id=${encodeURIComponent(challenge.id)}`;

    return `
        <article
            class="
                challenge-card
                challenge-card--${escapeHTML(challenge.challenge_key)}
            "
        >
            <div class="challenge-card__art">
                <img
                    src="${image}"
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
                        ${escapeHTML(dates)}
                    </p>

                    <h3 class="challenge-card__title">
                        ${escapeHTML(challenge.name)}
                    </h3>
                </div>

                <p class="challenge-card__meta">
                    ${escapeHTML(description)}
                </p>

                <div class="challenge-card__footer">
                    <span class="challenge-card__participants">
                        ${participantCount}
                        ${
                            participantCount === 1
                                ? "Participant"
                                : "Participants"
                        }
                    </span>

                    <a
                        href="${escapeHTML(link)}"
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