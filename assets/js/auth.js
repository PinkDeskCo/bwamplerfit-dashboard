/* ==================================================
   Authentication Helpers
================================================== */

async function requireAuth() {

    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .getSession();

    if (error) {
        console.error(
            "Session check failed:",
            error
        );
    }

    if (!data?.session) {

        window.location.href =
            "../login/login.html";

        return null;
    }

    return data.session;
}


async function signOutAdmin() {

    const { error } =
        await supabaseClient
            .auth
            .signOut();

    if (error) {

        console.error(
            "Sign out failed:",
            error
        );

        return false;
    }

    window.location.href =
        "../login/login.html";

    return true;
}