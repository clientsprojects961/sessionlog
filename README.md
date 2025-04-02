# Study Timer with Secret Chat

A beautiful and secure study timer application with a hidden secret chat feature. Perfect for students who want to stay focused while maintaining a private communication channel.

## Features

### Study Timer
- Clean, distraction-free interface
- Customizable Pomodoro timer (default: 25 minutes)
- Start, pause, and reset functionality
- Visual notification when timer completes (green flash effect)

### Secret Chat
- Hidden access through settings menu
- Password-protected entry
- Real-time messaging
- Support for text messages, images, and voice notes
- Auto-deleting messages
- Inactivity timeout (30 minutes)
- Emergency exit with ESC key
- Fake error screen for privacy

## Setup Instructions

1. Clone this repository
2. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
3. Enable Authentication and Firestore in your Firebase project
4. Replace the Firebase configuration in `app.js` with your own:
   ```javascript
   const firebaseConfig = {
       // Your Firebase config here
   };
   ```
5. Set your desired secret password in `app.js`:
   ```javascript
   const SECRET_PASSWORD = "your_secret_password";
   ```
6. Host the application on a web server (local or cloud)

## Security Features

- No permanent message storage
- Auto-deleting messages
- Inactivity timeout
- Password protection
- Emergency exit options
- Fake error screen
- Mobile-optimized interface

## Mobile Optimization

The application is optimized for:
- iPhone devices
- Safari browser
- Touch interactions
- Mobile-first design

## Technologies Used

- HTML5
- CSS3 (with Tailwind CSS)
- JavaScript (ES6+)
- Firebase (Authentication & Firestore)
- WebRTC (for voice notes)

## Browser Support

- Safari (iOS)
- Chrome
- Firefox
- Edge

## Privacy Note

This application is designed with privacy in mind. Messages are not permanently stored and will be deleted when:
- The chat is manually closed
- The page is refreshed
- The inactivity timeout is reached
- Messages are manually deleted

## License

MIT License - Feel free to use this project for personal or educational purposes. 