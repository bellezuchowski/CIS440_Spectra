const token = localStorage.getItem('jwtToken');
if (!token) {
    window.location.href = '/';
}

const leaderboardListEl = document.getElementById('leaderboard-list');
const loadingLabel = document.getElementById('loading-label');

async function loadLeaderboard() {
    try {
        const response = await fetch('/api/leaderboard', {
            method: 'GET',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch leaderboard');
        }

        const leaderboard = await response.json();

        // Hide loading text and clear list
        loadingLabel.style.display = 'none';
        leaderboardListEl.innerHTML = '';

        if (leaderboard.length === 0) {
            // Show no data message
            leaderboardListEl.innerHTML = `
                <div class="no-data">
                    <p>No leaderboard data available yet.</p>
                    <p>Be the first to get on the board!</p>
                </div>
            `;
            return;
        }

        // Render leaderboard entries as styled list items
        leaderboard.forEach((entry, index) => {
            const rank = index + 1;
            const li = document.createElement('li');
            li.className = `leaderboard-item rank-${rank <= 3 ? rank : 'other'}`;
            
            // Get user initials for avatar
            const firstInitial = entry.first_name ? entry.first_name.charAt(0) : '';
            const lastInitial = entry.last_name ? entry.last_name.charAt(0) : '';
            const initials = firstInitial + lastInitial || entry.email.charAt(0).toUpperCase();
            
            // Get trophy icon for top 3
            let trophyIcon = '';
            if (rank === 1) trophyIcon = '#1';
            else if (rank === 2) trophyIcon = '#2';
            else if (rank === 3) trophyIcon = '#3';

            li.innerHTML = `
                <div class="rank-info">
                    <div class="rank-number">${trophyIcon ? trophyIcon : rank}</div>
                    <div class="user-avatar">${initials}</div>
                    <div class="user-info">
                        <div class="user-name">${entry.first_name && entry.last_name ? `${entry.first_name} ${entry.last_name}` : 'Anonymous User'}</div>
                        <div class="user-email">${entry.email}</div>
                    </div>
                </div>
                <div class="score-info">
                    <div class="score">${entry.walk_hours || 0}</div>
                    <div class="score-label">Hours</div>
                </div>
            `;
            
            leaderboardListEl.appendChild(li);
        });

        console.log('Leaderboard data:', leaderboard);
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        loadingLabel.textContent = 'Error loading leaderboard. Please try again later.';
        loadingLabel.style.color = '#ff4757';
    }
}

loadLeaderboard();