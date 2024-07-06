import React, { useState, useEffect, useRef } from 'react';
import { auth, database, storage, loginUser, signOutUser, sendMessage, updateTypingStatus, updateUserStatus } from './firebase';
import './App.css';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, serverTimestamp, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { faDownload, faImage } from '@fortawesome/free-solid-svg-icons'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function App() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [image, setImage] = useState(null);
  const [typing, setTyping] = useState(false);
  const [typingStatus, setTypingStatus] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const messageEndRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        updateUserStatus(user.uid, true);
        scrollToBottom();
      }
    });

    return () => {
      if (user) {
        updateUserStatus(user.uid, false);
      }
      unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      const messagesRef = ref(database, 'messages');
      onValue(messagesRef, (snapshot) => {
        const messages = snapshot.val() || {};
        const messagesArray = Object.keys(messages).map(key => ({
          id: key,
          ...messages[key],
        }));
        setMessages(messagesArray);
        scrollToBottom();
      });

      const typingStatusRef = ref(database, 'typing');
      onValue(typingStatusRef, (snapshot) => {
        const typingData = snapshot.val();
        const typingUsers = Object.keys(typingData || {}).filter(uid => typingData[uid] && uid !== user.uid);
        setTypingStatus(typingUsers.length > 0 ? 'typing...' : '');
      });
    }
  }, [user]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' && !image) return;

    const messageData = {
      text: newMessage,
      createdAt: serverTimestamp(),
      uid: user.uid,
      displayName: user.displayName,
      imageUrl: null,
      seen: false,
    };

    if (image) {
      try {
        const imageRef = storageRef(storage, `images/${Date.now()}_${image.name}`);
        await uploadBytes(imageRef, image);
        messageData.imageUrl = await getDownloadURL(imageRef);
      } catch (error) {
        console.error("Error uploading image:", error);
        return;
      }
    }

    sendMessage(messageData);

    setNewMessage('');
    setImage(null);
    setTyping(false);
    updateTypingStatus(user.uid, false);
    scrollToBottom();
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    setTyping(true);
    updateTypingStatus(user.uid, true);
  };

  useEffect(() => {
    if (typing) {
      const timeoutId = setTimeout(() => {
        setTyping(false);
        updateTypingStatus(user.uid, false);
      }, 3000);

      return () => clearTimeout(timeoutId);
    }
  }, [typing, user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await loginUser(email, password);
      scrollToBottom();
    } catch (error) {
      console.error("Error logging in:", error);
    }
  };

  const handleImageDownload = (imageUrl) => {
    // Create a temporary anchor element
    const anchor = document.createElement('a');
    anchor.href = imageUrl;
    anchor.download = imageUrl.split('/').pop(); // Set the filename for download
    anchor.click(); // Trigger the download
  };

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="App">
      {user ? (
        <>
          <header>
            <h1>Chat App</h1>
            <button onClick={signOutUser}>Sign Out</button>
          </header>
          <main>
            <div className="messages">
              {messages.map((message) => (
                <div key={message.id} className={`message ${message.uid === user.uid ? 'sent' : 'received'}`}>
                  <p><strong>{message.displayName}</strong></p>
                  {message.text && <p>{message.text}</p>}
                  {message.imageUrl && (
                    <>
                      <img src={message.imageUrl} alt="Uploaded" />
                      <p>
                        <a href={message.imageUrl} onClick={() => handleImageDownload(message.imageUrl)}>
                          <FontAwesomeIcon icon={faDownload} /> Download Image
                        </a>
                      </p>
                    </>
                  )}
                  <p>{new Date(message.createdAt).toLocaleString()}</p>
                  <p>{message.seen ? 'Seen' : 'Sent'}</p>
                </div>
              ))}
              <div ref={messageEndRef}></div>
            </div>
            <div className="new-message">
              <input
                type="text"
                value={newMessage}
                onChange={handleTyping}
                placeholder="Type a message"
              />
              <input
                type="file"
                accept="image/*"
                id="imageUpload"
                onChange={(e) => setImage(e.target.files[0])}
              />
              <label htmlFor="imageUpload">
                <FontAwesomeIcon icon={faImage} />
              </label>
              <button onClick={handleSendMessage}>Send</button>
            </div>
            {typingStatus && <p>{typingStatus}</p>}
          </main>
        </>
      ) : (
        <div className="auth-form">
          <form onSubmit={handleLogin}>
            <h2>Login</h2>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
            <button type="submit">Login</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
