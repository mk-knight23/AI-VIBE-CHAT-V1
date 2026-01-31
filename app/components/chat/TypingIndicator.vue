<template>
  <div class="typing-indicator">
    <div class="typing-content">
      <div class="avatar assistant-avatar">
        <Icon name="mdi:robot" />
      </div>
      <div class="typing-body">
        <div class="typing-dots">
          <span class="dot" />
          <span class="dot" />
          <span class="dot" />
        </div>
        <span class="typing-text">AI is thinking...</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.typing-indicator {
  padding: 0.5rem 0;
}

.typing-content {
  display: flex;
  gap: 1rem;
  max-width: 90%;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.25rem;
}

.assistant-avatar {
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #06b6d4;
}

.typing-body {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.typing-dots {
  display: flex;
  gap: 0.25rem;
}

.dot {
  width: 8px;
  height: 8px;
  background: #8b5cf6;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

.typing-text {
  color: #94a3b8;
  font-size: 0.875rem;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
