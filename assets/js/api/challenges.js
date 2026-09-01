/* ==================================================
   Challenges API
================================================== */

async function getChallenges() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("challenges")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: true
                }
            );

    if (error) {

        console.error(
            "Unable to load challenges:",
            error
        );

        throw error;
    }

    return data ?? [];
}

/* ==================================================
   Challenge Participant Progress
================================================== */

async function getChallengeParticipantData() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("challenge_progress")
            .select(
                "participant_id, challenge_key"
            );

    if (error) {

        console.error(
            "Unable to load challenge participants:",
            error
        );

        throw error;
    }

    return data ?? [];
}

/* ==================================================
   Challenge Progress
================================================== */

async function getChallengeProgress(
    challengeKey
) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("challenge_progress")
            .select(`
                id,
                participant_id,
                challenge_key,
                progress,
                started_at,
                completed_at,
                certificate_name,
                challenge_participants (
                    id,
                    email,
                    user_id
                )
            `)
            .eq(
                "challenge_key",
                challengeKey
            );

    if (error) {

        console.error(
            "Unable to load challenge progress:",
            error
        );

        throw error;
    }

    return data ?? [];
}

/* ==================================================
   Challenge By ID
================================================== */

async function getChallengeById(
    challengeId
) {

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

        console.error(
            "Unable to load challenge:",
            error
        );

        throw error;
    }

    return data;
}