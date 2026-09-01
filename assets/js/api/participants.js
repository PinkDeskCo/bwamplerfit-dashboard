/* ==================================================
   Participant API
================================================== */

async function getParticipantById(
    participantId
) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("challenge_participants")
            .select(`
                id,
                email,
                user_id,
                created_at
            `)
            .eq(
                "id",
                participantId
            )
            .single();

    if (error) {

        console.error(
            "Unable to load participant:",
            error
        );

        throw error;
    }

    return data;
}

/* ==================================================
   Participant Challenge Progress
================================================== */

async function getParticipantChallengeProgress(
    participantId,
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
                certificate_name
            `)
            .eq(
                "participant_id",
                participantId
            )
            .eq(
                "challenge_key",
                challengeKey
            )
            .single();

    if (error) {

        console.error(
            "Unable to load participant progress:",
            error
        );

        throw error;
    }

    return data;
}
/* ==================================================
   Participant History
================================================== */

async function getParticipantHistory(
    participantId
) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("challenge_progress")
            .select(`
                id,
                challenge_key,
                progress,
                started_at,
                completed_at
            `)
            .eq(
                "participant_id",
                participantId
            )
            .order(
                "started_at",
                {
                    ascending: false
                }
            );

    if (error) {

        console.error(
            "Unable to load participant history:",
            error
        );

        throw error;
    }

    return data ?? [];
}
/* ==================================================
   All Participants
================================================== */

async function getAllParticipants() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("challenge_participants")
            .select(`
                id,
                email,
                user_id,
                created_at
            `)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (error) {

        console.error(
            "Unable to load participants:",
            error
        );

        throw error;
    }

    return data ?? [];
}


/* ==================================================
   All Participation Records
================================================== */

async function getAllParticipationHistory() {

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
                completed_at
            `);

    if (error) {

        console.error(
            "Unable to load participation history:",
            error
        );

        throw error;
    }

    return data ?? [];
}