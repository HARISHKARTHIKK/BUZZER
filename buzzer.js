(function () {
    // Use the initialized client from supabase.js
    const db = window.supabaseClient;
    const teamName = localStorage.getItem('teamName');

    const buzzerBtn = document.getElementById('buzzerBtn');
    const statusMessage = document.getElementById('statusMessage');
    const displayTeamName = document.getElementById('displayTeamName');
    const winnerBanner = document.getElementById('winnerBanner');
    const bannerWinnerName = document.getElementById('bannerWinnerName');
    const buzzerSound = document.getElementById('buzzerSound');

    if (!teamName) {
        window.location.href = 'index.html';
    }

    if (displayTeamName) {
        displayTeamName.textContent = teamName;
    }

    // 🔹 Force initial locked state
    if (buzzerBtn) {
        buzzerBtn.disabled = true;
        buzzerBtn.classList.remove('active');
    }

    // 🔹 Initialize
    async function init() {
        console.log("Initializing buzzer for team:", teamName);

        // Ensure UI starts in a clean, locked state
        buzzerBtn.disabled = true;
        buzzerBtn.classList.remove('active');
        statusMessage.textContent = 'Connecting...';

        const { data, error } = await db
            .from('game_state')
            .select('*')
            .eq('id', 1)
            .single();

        if (error) {
            console.error('Error fetching game state:', error);
            statusMessage.textContent = 'Connection Error';
            return;
        }

        if (data) {
            console.log("Initial state received:", data.status);
            handleStateUpdate(data);
        } else {
            statusMessage.textContent = 'Waiting for Host...';
        }
    }

    // 🔹 Update UI based on State
    function handleStateUpdate(state) {
        if (!state) return;
        console.log("UI Update - Status:", state.status, "Winner:", state.winner_name);

        if (state.status === 'active') {
            // ROUND OPEN
            buzzerBtn.disabled = false;
            buzzerBtn.classList.add('active');
            statusMessage.textContent = 'READY TO BUZZ!';
            statusMessage.className = 'status-message';
            if (winnerBanner) winnerBanner.classList.remove('show');
        } else {
            // ROUND LOCKED/IDLE
            buzzerBtn.disabled = true;
            buzzerBtn.classList.remove('active');

            if (state.status === 'locked') {
                if (state.winner_name === teamName) {
                    statusMessage.textContent = 'YOU BUZZED FIRST!';
                    statusMessage.className = 'status-message winner-message';
                } else if (state.winner_name) {
                    statusMessage.textContent = 'TOO LATE!';
                    statusMessage.className = 'status-message too-late-message';
                } else {
                    statusMessage.textContent = 'ROUND LOCKED';
                }

                if (state.winner_name && winnerBanner) {
                    bannerWinnerName.textContent = state.winner_name;
                    winnerBanner.classList.add('show');
                } else if (winnerBanner) {
                    winnerBanner.classList.remove('show');
                }
            } else {
                statusMessage.textContent = 'Waiting for Host...';
                if (winnerBanner) winnerBanner.classList.remove('show');
            }
        }
    }

    // 🔹 Buzzer Logic
    async function buzz() {
        if (buzzerBtn.disabled) return;

        // Disable early to prevent double click
        buzzerBtn.disabled = true;

        // 1. Re-check status from server before inserting
        const { data: state, error: stateError } = await db
            .from('game_state')
            .select('*')
            .eq('id', 1)
            .single();

        if (stateError || !state || state.status !== 'active') {
            console.log('Too late, round already locked.');
            return;
        }

        // 2. Play Sound
        if (buzzerSound) {
            buzzerSound.currentTime = 0;
            buzzerSound.play().catch(e => console.log('Audio error:', e));
        }

        // 3. Insert into buzzers log
        const { error: insertError } = await db
            .from('buzzers')
            .insert([{ team_name: teamName }]);

        if (insertError) {
            console.error('Error inserting buzz:', insertError);
            return;
        }

        // 4. Update game state to Lock the round for everyone
        const { error: lockError } = await db
            .from('game_state')
            .update({
                status: 'locked',
                winner_name: teamName,
                winner_timestamp: new Date().toISOString()
            })
            .eq('id', 1);

        if (lockError) {
            console.error('Error locking round:', lockError);
            // Re-enable if locking failed so they can try again or see error
            buzzerBtn.disabled = false;
        }
    }

    // 🔹 Realtime subscription
    db.channel('buzzer_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'game_state' }, payload => {
            console.log("Game state change detected:", payload.eventType, payload.new);
            if (payload.new) handleStateUpdate(payload.new);
            else init(); // Fallback to fetch current state
        })
        .subscribe((status) => console.log("Buzzer Realtime Status:", status));

    if (buzzerBtn) {
        buzzerBtn.addEventListener('click', buzz);
    }

    // Run init
    init();
})();