/**
 * Smallie Timer - Countdown to 9 PM WAT voting closure and daily task management
 * This script manages the countdown timer, progress bar, and current task display
 */

// DOM Elements
const hoursElement = document.getElementById('hours');
const minutesElement = document.getElementById('minutes');
const secondsElement = document.getElementById('seconds');
const progressBar = document.getElementById('voting-progress');
const taskTitleElement = document.getElementById('current-task-title');
const taskDescriptionElement = document.getElementById('current-task-description');
const taskDateElement = document.getElementById('current-task-date');

// Function to update the countdown to 9 PM WAT (West Africa Time)
function updateVotingCountdown() {
    // Get current date and time
    const now = new Date();
    
    // Create target date (today at 9 PM WAT)
    // WAT is UTC+1
    const target = new Date();
    target.setUTCHours(20, 0, 0, 0); // 9 PM WAT = 8 PM UTC
    
    // If it's already past 9 PM WAT, set target to next day
    if (now > target) {
        target.setDate(target.getDate() + 1);
    }
    
    // Calculate time difference in milliseconds
    const timeDiff = target - now;
    
    // Calculate hours, minutes, seconds
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    // Update DOM elements
    hoursElement.textContent = String(hours).padStart(2, '0');
    minutesElement.textContent = String(minutes).padStart(2, '0');
    secondsElement.textContent = String(seconds).padStart(2, '0');
    
    // Update progress bar
    updateProgressBar(now, target);
}

// Function to update progress bar
function updateProgressBar(now, target) {
    // If it's past 9 PM, we're showing progress toward the next day
    // We define new task time at 9 AM WAT
    const newTaskTime = new Date();
    newTaskTime.setUTCHours(8, 0, 0, 0); // 9 AM WAT = 8 AM UTC
    
    // If it's already past 9 AM, new task time is today at 9 AM
    // If before 9 AM, new task time was yesterday at 9 AM
    if (now.getUTCHours() < 8) {
        newTaskTime.setDate(newTaskTime.getDate() - 1);
    }
    
    // Calculate total duration between new task announcement and voting closure
    const totalDuration = target - newTaskTime;
    
    // Calculate elapsed time since new task announcement
    const elapsedTime = now - newTaskTime;
    
    // Calculate progress percentage (capped at 100%)
    let progressPercent = (elapsedTime / totalDuration) * 100;
    progressPercent = Math.min(Math.max(progressPercent, 0), 100);
    
    // Update progress bar width
    progressBar.style.width = `${progressPercent}%`;
}

// Get today's date in competition period (April 15-21, 2025)
const getTodayDate = () => {
    const now = new Date();
    // For the competition in April 15-21, 2025
    const competitionStart = new Date(2025, 3, 15); // April 15, 2025
    const competitionEnd = new Date(2025, 3, 21); // April 21, 2025
    
    // Check if we're in the competition period
    if (now < competitionStart) {
        return null; // Competition hasn't started
    } else if (now > competitionEnd) {
        return null; // Competition has ended
    }
    
    // Calculate which day of the competition we're in (1-7)
    const timeDiff = now.getTime() - competitionStart.getTime();
    const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1;
    
    return dayDiff;
};

// Fetch task for today (using hardcoded tasks instead of Firebase for reliability)
const fetchCurrentTask = async () => {
    try {
        const dayNumber = getTodayDate();
        
        if (!dayNumber) {
            return getDefaultTask();
        }
        
        // Simply use hardcoded tasks for reliability
        return getHardcodedTask(dayNumber);
        
    } catch (error) {
        console.error('Error fetching task:', error);
        return getDefaultTask();
    }
};

// Get default task if none found
const getDefaultTask = () => {
    return {
        title: "Smallie Challenge",
        description: "Stay tuned for today's challenge!",
        day: 0,
        date: new Date()
    };
};

// Get hardcoded task for specific day
const getHardcodedTask = (day) => {
    const tasks = [
        {
            day: 1,
            title: "Naija Throwback Dance Challenge",
            description: "Perform a 60-second dance to a classic Nigerian hit (e.g., P-Square, Fela).",
            date: new Date(2025, 3, 15)
        },
        {
            day: 2,
            title: "Jollof Wars: Cook-Off Edition",
            description: "Cook jollof rice with ₦500 in 10 minutes, taste and hype it.",
            date: new Date(2025, 3, 16)
        },
        {
            day: 3,
            title: "Nollywood Skit Showdown",
            description: "Act a 2-minute Nollywood-style skit (e.g., Cheating Husband).",
            date: new Date(2025, 3, 17)
        },
        {
            day: 4,
            title: "Afrobeat Freestyle Face-Off",
            description: "Freestyle a 1-minute rap/song on a trending beat (e.g., Burna Boy).",
            date: new Date(2025, 3, 18)
        },
        {
            day: 5,
            title: "Owambe Fashion Flex",
            description: "Style an owambe outfit from home, model in a 90-second catwalk.",
            date: new Date(2025, 3, 19)
        },
        {
            day: 6,
            title: "Pidgin Proverbs Remix",
            description: "Turn a proverb (e.g., Monkey no fine...) into a 60-second pidgin skit/song.",
            date: new Date(2025, 3, 20)
        },
        {
            day: 7,
            title: "Lagos Hustle Pitch",
            description: "Pitch yourself as Smallie winner in a 3-minute video.",
            date: new Date(2025, 3, 21)
        }
    ];
    
    return tasks.find(task => task.day === day) || getDefaultTask();
};

// Update task display on the page
const updateTaskDisplay = async () => {
    const taskInfo = await fetchCurrentTask();
    
    // Update task title and description in the UI
    if (taskTitleElement) {
        taskTitleElement.textContent = taskInfo.title;
    }
    
    if (taskDescriptionElement) {
        taskDescriptionElement.textContent = taskInfo.description;
    }
    
    if (taskDateElement && taskInfo.date) {
        const formattedDate = taskInfo.date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        taskDateElement.textContent = formattedDate;
    }
};

// Initialize and start timer
updateVotingCountdown();
setInterval(updateVotingCountdown, 1000);

// Update task display (fetch from Firebase or use hardcoded)
updateTaskDisplay();