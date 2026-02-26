(function () {
    // Use the initialized client from supabase.js
    const db = window.supabaseClient;
    const ADMIN_PASSWORD = '123';

    const loginSection = document.getElementById('loginSection');
    const adminControls = document.getElementById('adminControls');
    const winnerDisplay = document.getElementById('winnerDisplay');
    const buzzList = document.getElementById('buzzList');
    const adminPassInput = document.getElementById('adminPass');

    function checkAdmin() {
        if (adminPassInput.value === ADMIN_PASSWORD) {
            loginSection.style.display = 'none';
            adminControls.style.display = 'block';
            initAdmin();
        } else {
            alert('Incorrect Password');
        }
    }

    function initAdmin() {
        // 🔹 Subscribe to State Changes (status, winner)
        const stateChannel = db.channel('state_updates')
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'game_state' },
                payload => {
                    console.log("State updated in DB:", payload.new);
                    updateUI(payload.new);
                }
            )
            .subscribe((status) => console.log("State Subscription:", status));

        // 🔹 Subscribe to Buzzers (when someone presses the button)
        const buzzChannel = db.channel('buzz_updates')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'buzzers' },
                payload => {
                    console.log("Buzzer event detected:", payload.eventType);
                    fetchBuzzes();
                }
            )
            .subscribe((status) => console.log("Buzzer Subscription:", status));

        fetchInitialState().then(() => {
            // Force a reset when admin joins to ensure everything starts clean in the DATABASE
            resetRound();
        });
    }

    async function fetchInitialState() {
        const { data } = await db.from('game_state').select('*').eq('id', 1).single();
        if (data) updateUI(data);
        fetchBuzzes();
    }

    function updateUI(state) {
        if (state && winnerDisplay) {
            winnerDisplay.textContent = state.winner_name || 'None';
        }
    }

    async function fetchBuzzes() {
        const { data, error } = await db
            .from('buzzers')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching buzzes:', error);
            return;
        }

        if (buzzList) {
            // ALWAYS clear and rebuild the list
            buzzList.innerHTML = '<h3 style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 1rem;">Buzz Order</h3>';

            if (data && data.length > 0) {
                data.forEach((buzz, index) => {
                    const time = new Date(buzz.created_at).toLocaleTimeString();
                    const div = document.createElement('div');
                    div.className = 'buzz-item';
                    div.innerHTML = `
                        <span class="rank">#${index + 1}</span>
                        <span class="name">${buzz.team_name}</span>
                        <span class="time">${time}</span>
                    `;
                    buzzList.appendChild(div);
                });
            }
        }
    }

    async function startRound() {
        console.log("Attempting to Start Round...");

        try {
            // 1. Clear previous buzzers in DB
            const { error: delError } = await db.from('buzzers').delete().not('team_name', 'is', null);
            if (delError) console.error("Error clearing buzzers:", delError);

            // 2. Set state to ACTIVE
            const { error: updError } = await db
                .from('game_state')
                .update({
                    status: 'active',
                    winner_name: null,
                    winner_timestamp: null
                })
                .eq('id', 1);

            if (updError) {
                console.error("❌ Error starting round:", updError.message);
                alert("Failed to start round: " + updError.message);
                return;
            }

            console.log("✅ Round Started!");

            // Force local UI refresh
            fetchBuzzes();
            if (winnerDisplay) winnerDisplay.textContent = 'None';
        } catch (err) {
            console.error("Uncaught error during start:", err);
        }
    }

    async function resetRound() {
        console.log("Attempting to Reset Round...");

        try {
            // 1. Clear previous buzzers in DB
            // Using a filter that targets all rows safely
            const { error: delError } = await db.from('buzzers').delete().not('team_name', 'is', null);

            if (delError) {
                console.error("❌ Error deleting buzzers:", delError.message);
                alert("Failed to clear buzzers: " + delError.message);
                return;
            }

            // 2. Set status to WAITING (deactivated)
            const { error: updError } = await db
                .from('game_state')
                .update({
                    status: 'waiting',
                    winner_name: null,
                    winner_timestamp: null
                })
                .eq('id', 1);

            if (updError) {
                console.error("❌ Error updating state:", updError.message);
                alert("Failed to update status: " + updError.message);
                return;
            }

            console.log("✅ Round Reset successfully!");

            // Force local UI refresh
            fetchBuzzes();
            if (winnerDisplay) winnerDisplay.textContent = 'None';

        } catch (err) {
            console.error("Uncaught error during reset:", err);
        }
    }

    // Map functions to window for HTML onclick handlers
    window.checkAdmin = checkAdmin;
    window.startRound = startRound;
    window.resetRound = resetRound;
})();