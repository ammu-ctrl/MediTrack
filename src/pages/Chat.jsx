// src/pages/Chat.jsx

import React, { useState, useRef, useEffect } from "react";

const GROQ_API_KEY = "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";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function Chat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am MediTrack Assistant powered by AI 💊 I can help you with medication questions, health tips, diet advice, and more. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userInput = input.trim();
    const newMessages = [...messages, { role: "user", content: userInput }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const apiMessages = newMessages.map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));

      const response = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            {
              role: "system",
              content: "You are healthassistant, an intelligent healthcare companion built into MediTrack. Help users with medication questions, health tips, diet advice, exercise recommendations, and general wellness. Be friendly, clear, and always recommend consulting a doctor for serious medical concerns.",
            },
            ...apiMessages,
          ],
          max_tokens: 1000,
        }),
      });

      const data = await response.json();
      if (data.choices && data.choices[0]) {
        setMessages(prev => [...prev, { role: "assistant", content: data.choices[0].message.content }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Sorry I could not process that. Please try again." }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please check your internet and try again." }]);
    }

    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: "assistant",
      content: "Hello! I am MediTrack Assistant powered by AI 💊 How can I help you today?",
    }]);
  };

  const quickQuestions = [
    "What is paracetamol used for?",
    "What if I missed a dose?",
    "Diet tips for diabetes",
    "How does MediTrack work?",
    "Tips for better sleep",
    "How much water should I drink?",
  ];

  const renderMessage = (content) => {
    return content.split("\n").map((line, i) => (
      <span key={i}>{line}{i < content.split("\n").length - 1 && <br />}</span>
    ));
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>💬 MediTrack AI Assistant</h1>
          <p style={styles.subtitle}>Powered by Groq AI — Ask me anything about your health</p>
        </div>
        <button style={styles.clearBtn} onClick={clearChat}>🗑 Clear Chat</button>
      </div>

      <div style={styles.quickQuestions}>
        {quickQuestions.map((q, i) => (
          <button key={i} style={styles.quickBtn} onClick={() => setInput(q)}>{q}</button>
        ))}
      </div>

      <div style={styles.chatWindow}>
        {messages.map((msg, i) => (
          <div key={i} style={msg.role === "user" ? styles.userMessageWrapper : styles.assistantMessageWrapper}>
            {msg.role === "assistant" && <div style={styles.avatarIcon}>💊</div>}
            <div style={msg.role === "user" ? styles.userMessage : styles.assistantMessage}>
              {renderMessage(msg.content)}
            </div>
            {msg.role === "user" && <div style={styles.userAvatar}>👤</div>}
          </div>
        ))}
        {loading && (
          <div style={styles.assistantMessageWrapper}>
            <div style={styles.avatarIcon}>💊</div>
            <div style={styles.assistantMessage}>
              <span style={styles.typing}>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={styles.inputArea}>
        <input
          type="text"
          placeholder="Ask a health question..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          style={styles.input}
          disabled={loading}
        />
        <button onClick={handleSend} style={loading ? styles.sendBtnDisabled : styles.sendBtn} disabled={loading}>
          {loading ? "..." : "➤ Send"}
        </button>
      </div>
      <p style={styles.disclaimer}>⚠️ MediTrack Assistant provides general health information only. Always consult your doctor for medical advice.</p>
    </div>
  );
}

const styles = {
  container: { padding: "32px", maxWidth: "800px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
  title: { fontSize: "28px", color: "#333", margin: "0 0 4px 0" },
  subtitle: { color: "#888", fontSize: "14px", margin: "0" },
  clearBtn: { backgroundColor: "#f5f5f5", color: "#666", border: "1px solid #ddd", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" },
  quickQuestions: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" },
  quickBtn: { backgroundColor: "#e3f2fd", color: "#1976d2", border: "1px solid #90caf9", padding: "6px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "13px" },
  chatWindow: { backgroundColor: "white", borderRadius: "12px", padding: "20px", height: "450px", overflowY: "auto", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: "16px" },
  userMessageWrapper: { display: "flex", justifyContent: "flex-end", marginBottom: "16px", gap: "8px", alignItems: "flex-end" },
  assistantMessageWrapper: { display: "flex", justifyContent: "flex-start", marginBottom: "16px", gap: "8px", alignItems: "flex-end" },
  avatarIcon: { width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#e3f2fd", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 },
  userAvatar: { width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 },
  userMessage: { backgroundColor: "#1976d2", color: "white", padding: "12px 16px", borderRadius: "18px 18px 4px 18px", maxWidth: "70%", fontSize: "14px", lineHeight: "1.6" },
  assistantMessage: { backgroundColor: "#f0f4f8", color: "#333", padding: "12px 16px", borderRadius: "18px 18px 18px 4px", maxWidth: "75%", fontSize: "14px", lineHeight: "1.6" },
  typing: { color: "#1976d2", fontStyle: "italic" },
  inputArea: { display: "flex", gap: "12px", marginBottom: "12px" },
  input: { flex: 1, padding: "12px 16px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "15px", outline: "none" },
  sendBtn: { backgroundColor: "#1976d2", color: "white", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontSize: "15px" },
  sendBtnDisabled: { backgroundColor: "#90caf9", color: "white", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "not-allowed", fontSize: "15px" },
  disclaimer: { color: "#bbb", fontSize: "12px", textAlign: "center", margin: "0" },
};

export default Chat;