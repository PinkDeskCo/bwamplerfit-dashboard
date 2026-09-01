

function renderAdminSidebar(activePage) {

    const sidebar =
        document.getElementById(
            "admin-sidebar"
        );

    if (!sidebar) {
        return;
    }

    const isChallengeAnchor =
        window.location.hash ===
        "#challenges";

    const dashboardIsActive =
        activePage === "dashboard" &&
        !isChallengeAnchor;

    const challengesIsActive =
        activePage === "challenges" ||
        isChallengeAnchor;

    sidebar.innerHTML = `
        <div class="admin-sidebar__brand">

            <div class="admin-sidebar__brand-mark">

                <span class="admin-sidebar__spark">
                    ✦
                </span>

                <span class="admin-sidebar__brand-name">
                    BWamplerFit
                </span>

                <span class="admin-sidebar__spark">
                    ✦
                </span>

            </div>

            <p class="admin-sidebar__title">
                Challenge Dashboard
            </p>

        </div>

        <nav
            class="admin-nav"
            aria-label="Admin navigation"
        >

            <a
                href="../dashboard/dashboard.html"
                class="
                    admin-nav__link
                    ${dashboardIsActive
                        ? "is-active"
                        : ""}
                "
            >
                Dashboard
            </a>

            <a
                href="../dashboard/dashboard.html#challenges"
                class="
                    admin-nav__link
                    ${challengesIsActive
                        ? "is-active"
                        : ""}
                "
            >
                Challenges
            </a>

            <a
                href="../participants/participants.html"
                class="
                    admin-nav__link
                    ${activePage === "participants"
                        ? "is-active"
                        : ""}
                "
            >
                Participants
            </a>

        </nav>

        <div class="admin-sidebar__footer">

            <button
                type="button"
                class="admin-signout"
                id="logout-button"
            >
                Sign Out
            </button>

        </div>
    `;
}