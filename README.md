# Location Task Reminder

A web application that reminds you about tasks when you're near specific locations.

## Features

- Add tasks with associated locations using Google Maps URLs
- Automatic location tracking
- Get notified when you're within 1 mile of a task location
- Clean, simple interface

## How It Works

1. Add a task (e.g., "Buy drill")
2. Add the location name (e.g., "Home Depot")
3. Paste a Google Maps URL for that location
4. Start location tracking
5. Get notified automatically when you're nearby!

## Technologies Used

- React
- Vite
- Tailwind CSS
- Geolocation API
- Notification API

## Setup
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open `http://localhost:5173` in your browser.

## Usage

1. Search for a location in Google Maps
2. Copy the full URL from the address bar (or the shortened goo.gl link)
3. Paste it when adding a task in the app
4. Click "Start Location Tracking"
5. Keep the browser tab open for tracking to work

## Note

This is a web app, so location tracking only works while the browser tab is open.