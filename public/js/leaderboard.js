const token = localStorage.getItem('jwtToken');
if (!token) {
    window.location.href = '/';
}

const leaderboardListEl = document.getElementById('leaderboard-list');
const loadingLabel = document.querySelector('#leaderboard-container label');

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
        leaderboardListEl.textContent = '';

        // Render leaderboard entries as list items
        leaderboard.forEach((entry, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${entry.first_name} ${entry.last_name}: ${entry.walk_hours} hours`;
            leaderboardListEl.appendChild(li);
        });

        console.log('Leaderboard data:', leaderboard);
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}

loadLeaderboard();