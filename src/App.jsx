import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Bell, Navigation, Link } from 'lucide-react';

export default function LocationTaskApp() {
  const [tasks, setTasks] = useState([]);
  const [taskName, setTaskName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [tracking, setTracking] = useState(false);
  const [notifiedTasks, setNotifiedTasks] = useState(new Set());

  // Request location permission and start tracking
  useEffect(() => {
    if (tracking && 'geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(newLocation);
          checkProximity(newLocation);
        },
        (error) => {
          console.error('Location error:', error);
          setNotifications(prev => [...prev, { id: Date.now(), text: 'Location access denied or unavailable' }]);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [tracking, tasks]);

  // Extract coordinates from Google Maps URL
  const extractCoordinates = (url) => {
    try {
      // Pattern 1: @lat,lng,zoom format
      const pattern1 = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
      const match1 = url.match(pattern1);
      if (match1) {
        return { lat: parseFloat(match1[1]), lng: parseFloat(match1[2]) };
      }

      // Pattern 2: q=lat,lng format
      const pattern2 = /q=(-?\d+\.\d+),(-?\d+\.\d+)/;
      const match2 = url.match(pattern2);
      if (match2) {
        return { lat: parseFloat(match2[1]), lng: parseFloat(match2[2]) };
      }

      // Pattern 3: place_id or search query - try to extract from URL
      const pattern3 = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/;
      const match3 = url.match(pattern3);
      if (match3) {
        return { lat: parseFloat(match3[1]), lng: parseFloat(match3[2]) };
      }

      // Pattern 4: /maps/place with coordinates
      const pattern4 = /\/maps\/place\/[^/]+\/@(-?\d+\.\d+),(-?\d+\.\d+)/;
      const match4 = url.match(pattern4);
      if (match4) {
        return { lat: parseFloat(match4[1]), lng: parseFloat(match4[2]) };
      }

      // Pattern 5: Short URL (maps.app.goo.gl) or place_id URL
      // For these, we need to tell the user to expand it first
      if (url.includes('maps.app.goo.gl') || url.includes('goo.gl')) {
        return 'SHORT_URL';
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Check if user is near any task locations
  const checkProximity = (currentLocation) => {
    const proximityThreshold = 1609; // 1 mile = 1609.34 meters
    
    tasks.forEach(task => {
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        task.lat,
        task.lng
      );

      if (distance <= proximityThreshold && !notifiedTasks.has(task.id)) {
        // Send notification
        const notifText = `📍 Nearby reminder: ${task.name} at ${task.location}`;
        setNotifications(prev => [...prev, { id: Date.now(), text: notifText }]);
        setNotifiedTasks(prev => new Set([...prev, task.id]));
        
        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Task Nearby!', {
            body: notifText,
            icon: '📍'
          });
        }
      } else if (distance > proximityThreshold * 2) {
        // Reset notification status if user moves far away
        setNotifiedTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(task.id);
          return newSet;
        });
      }
    });
  };

  const addTask = () => {
    if (!taskName || !locationName || !googleMapsUrl) {
      alert('Please fill in all fields');
      return;
    }

    const coords = extractCoordinates(googleMapsUrl);
    if (!coords) {
      alert('Could not extract coordinates from Google Maps URL. Please make sure you copied the full URL from Google Maps.');
      return;
    }

    const newTask = {
      id: Date.now(),
      name: taskName,
      location: locationName,
      lat: coords.lat,
      lng: coords.lng,
      mapsUrl: googleMapsUrl
    };

    setTasks([...tasks, newTask]);
    setTaskName('');
    setLocationName('');
    setGoogleMapsUrl('');
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
    setNotifiedTasks(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const toggleTracking = async () => {
    if (!tracking) {
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }
    setTracking(!tracking);
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <MapPin className="text-indigo-600" />
            Location Task Reminder
          </h1>
          <p className="text-gray-600 mb-4">Get notified when you're near places where you have tasks</p>

          {/* Tracking Toggle */}
          <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
            <button
              onClick={toggleTracking}
              className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                tracking 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <Navigation className={tracking ? 'animate-pulse' : ''} size={20} />
              {tracking ? 'Tracking Active ✓' : 'Start Location Tracking'}
            </button>
            {userLocation && (
              <p className="text-sm text-gray-600 mt-2 text-center">
                Current: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </p>
            )}
          </div>

          {/* Add Task Form */}
          <div className="space-y-4 mb-6">
            <input
              type="text"
              placeholder="Task (e.g., Buy drill)"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Location name (e.g., Home Depot Downtown)"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Paste Google Maps URL here"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-gray-700">
                <p className="font-semibold mb-1 flex items-center gap-1">
                  <Link size={14} /> How to get Google Maps URL:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Open Google Maps and search for the location</li>
                  <li>Click "Share" button</li>
                  <li>Copy the link and paste it above</li>
                  <li>Or just copy the URL from your browser's address bar</li>
                </ol>
              </div>
            </div>
            <button
              onClick={addTask}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Plus size={20} />
              Add Task
            </button>
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-6 space-y-2">
            {notifications.map(notif => (
              <div key={notif.id} className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-lg flex items-start gap-3">
                <Bell className="text-yellow-700 flex-shrink-0 mt-1" size={20} />
                <p className="flex-1 text-yellow-800">{notif.text}</p>
                <button
                  onClick={() => dismissNotification(notif.id)}
                  className="text-yellow-700 hover:text-yellow-900"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Task List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Your Tasks ({tasks.length})</h2>
          {tasks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No tasks yet. Add one above!</p>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{task.name}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin size={14} />
                        {task.location}
                      </p>
                      <a 
                        href={task.mapsUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center gap-1"
                      >
                        <Link size={12} />
                        Open in Google Maps
                      </a>
                      {userLocation && (
                        <p className="text-xs text-indigo-600 mt-1">
                          Distance: {(calculateDistance(userLocation.lat, userLocation.lng, task.lat, task.lng) / 1000).toFixed(2)} km away
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-gray-600">
          <p className="font-semibold mb-2">📱 How to use:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Search for a location in Google Maps</li>
            <li>Copy the URL (either from Share button or address bar)</li>
            <li>Paste it when adding a task</li>
            <li>Start location tracking</li>
            <li>You'll get notified when you're within 1 mile of any task location</li>
          </ol>
        </div>
      </div>
    </div>
  );
}