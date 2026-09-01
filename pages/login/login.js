/* ==================================================
   Admin Login
================================================== */

const loginForm = document.getElementById("login-form");
const loginButton = document.getElementById( "login-button");
const loginMessage = document.getElementById( "login-message");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("password")
                    .value;

            loginMessage.textContent = "";

            loginButton.disabled = true;
            loginButton.textContent =
                "Signing In...";

            try {

                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .auth
                        .signInWithPassword({
                            email,
                            password
                        });

                if (error) {
                    throw error;
                }

                if (!data.session) {
                    throw new Error(
                        "No session was created."
                    );
                }

                window.location.href =
                    "../dashboard/dashboard.html";

            } catch (error) {

                console.error(
                    "Login failed:",
                    error
                );

                loginMessage.textContent =
                    "Unable to sign in. Check your email and password.";

            } finally {

                loginButton.disabled = false;
                loginButton.textContent =
                    "Sign In";

            }

        }
    );

}