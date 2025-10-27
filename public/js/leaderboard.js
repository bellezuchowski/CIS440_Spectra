const token = localStorage.getItem('jwtToken');
if (!token) {
    window.location.href = '/';
}

const leaderboardListEl = document.getElementById('leaderboard-list');
const loadingLabel = document.getElementById('loading-label');

let leaderboardData = [];
let currentSort = 'walk_hours';

// Activity type labels for display
const activityLabels = {
    walk_hours: { label: 'Hours', icon: 'Walking' },
    run_hours: { label: 'Hours', icon: 'Running' },
    cycle_hours: { label: 'Hours', icon: 'Cycling' },
    hiking_hours: { label: 'Hours', icon: 'Hiking' },
    swimming_hours: { label: 'Hours', icon: 'Swimming' },
    total_hours: { label: 'Hours', icon: 'Total' }
};

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

        leaderboardData = await response.json();
        
        // Calculate total hours for each user
        leaderboardData.forEach(entry => {
            entry.total_hours = (entry.walk_hours || 0) + 
                              (entry.run_hours || 0) + 
                              (entry.cycle_hours || 0) + 
                              (entry.hiking_hours || 0) + 
                              (entry.swimming_hours || 0);
        });

        // Hide loading text
        if (loadingLabel) {
            loadingLabel.style.display = 'none';
        }
        
        // Initial render with default sort
        renderLeaderboard(currentSort);
        
        console.log('Leaderboard data:', leaderboardData);
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        if (loadingLabel) {
            loadingLabel.textContent = 'Error loading leaderboard. Please try again later.';
            loadingLabel.style.color = '#ff4757';
        }
    }
}

function sortLeaderboard(sortBy) {
    return [...leaderboardData].sort((a, b) => {
        const aValue = a[sortBy] || 0;
        const bValue = b[sortBy] || 0;
        return bValue - aValue; // Descending order
    });
}

function renderLeaderboard(sortBy) {
    const sortedData = sortLeaderboard(sortBy);
    leaderboardListEl.innerHTML = '';

    if (sortedData.length === 0) {
        leaderboardListEl.innerHTML = `
            <div class="no-data">
                <p>No leaderboard data available yet.</p>
                <p>Be the first to get on the board!</p>
            </div>
        `;
        return;
    }

    // Render leaderboard entries as styled list items
    sortedData.forEach((entry, index) => {
        const rank = index + 1;
        const li = document.createElement('li');
        li.className = `leaderboard-item rank-${rank <= 3 ? rank : 'other'}`;
        
        // Get user initials for avatar
        const firstInitial = entry.first_name ? entry.first_name.charAt(0) : '';
        const lastInitial = entry.last_name ? entry.last_name.charAt(0) : '';
        const initials = firstInitial + lastInitial || entry.email.charAt(0).toUpperCase();
        
        // Get rank display for top 3
        let rankDisplay = rank;
        if (rank === 1) rankDisplay = '1st';
        else if (rank === 2) rankDisplay = '2nd';
        else if (rank === 3) rankDisplay = '3rd';
        
        // Get the score for current sort type
        const score = entry[sortBy] || 0;
        const activity = activityLabels[sortBy];

        li.innerHTML = `
            <div class="rank-info">
                <div class="rank-number">${rankDisplay}</div>
                <div class="user-avatar">${initials}</div>
                <div class="user-info">
                    <div class="user-name">${entry.first_name && entry.last_name ? `${entry.first_name} ${entry.last_name}` : 'Anonymous User'}</div>
                    <div class="user-email">${entry.email}</div>
                </div>
            </div>
            <div class="score-info">
                <div class="score">${score}</div>
                <div class="score-label">${activity.label}</div>
            </div>
        `;
        
        leaderboardListEl.appendChild(li);
    });
}

// Initialize sort buttons when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const sortButtons = document.querySelectorAll('.sort-btn');
    const backToProfileBtn = document.getElementById('back-to-profile-btn');
    
    // Add event listeners to sort buttons
    sortButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            sortButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Update current sort and re-render
            currentSort = button.dataset.sort;
            if (leaderboardData.length > 0) {
                renderLeaderboard(currentSort);
            }
        });
    });

    // Add event listener for back to profile button
    if (backToProfileBtn) {
        backToProfileBtn.addEventListener('click', () => {
            window.location.href = '/profile';
        });
    }
});

// Load initial data
loadLeaderboard();