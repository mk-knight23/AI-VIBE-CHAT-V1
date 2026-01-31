<template>
  <div class="settings-panel">
    <n-tabs type="line" animated>
      <n-tab-pane name="general" tab="General">
        <div class="settings-section">
          <h3>Appearance</h3>

          <div class="setting-item">
            <label>Theme</label>
            <n-select
              v-model:value="settings.theme"
              :options="themeOptions"
              @update:value="setTheme"
            />
          </div>

          <div class="setting-item">
            <label>Font Size</label>
            <n-select
              v-model:value="settings.fontSize"
              :options="fontSizeOptions"
              @update:value="setFontSize"
            />
          </div>

          <div class="setting-item">
            <n-checkbox v-model:checked="settings.showTimestamps" @update:checked="toggleTimestamps">
              Show message timestamps
            </n-checkbox>
          </div>

          <div class="setting-item">
            <n-checkbox v-model:checked="settings.showTokens" @update:checked="toggleTokens">
              Show token usage
            </n-checkbox>
          </div>
        </div>

        <div class="settings-section">
          <h3>Behavior</h3>

          <div class="setting-item">
            <n-checkbox v-model:checked="settings.enterToSend" @update:checked="toggleEnterToSend">
              Press Enter to send message
            </n-checkbox>
          </div>
        </div>
      </n-tab-pane>

      <n-tab-pane name="provider" tab="AI Provider">
        <div class="settings-section">
          <h3>Default Provider</h3>

          <div class="setting-item">
            <label>Provider</label>
            <n-select
              v-model:value="defaultProvider"
              :options="providerOptions"
              @update:value="setDefaultProvider"
            />
          </div>

          <div class="setting-item">
            <label>Model</label>
            <n-select
              v-model:value="defaultModel"
              :options="modelOptions"
              @update:value="setDefaultModel"
            />
          </div>
        </div>

        <div class="settings-section">
          <h3>Generation Parameters</h3>

          <div class="setting-item">
            <label>Temperature: {{ settings.temperature }}</label>
            <n-slider
              v-model:value="settings.temperature"
              :min="0"
              :max="2"
              :step="0.1"
              @update:value="setTemperature"
            />
          </div>

          <div class="setting-item">
            <label>Max Tokens: {{ settings.maxTokens }}</label>
            <n-slider
              v-model:value="settings.maxTokens"
              :min="256"
              :max="4096"
              :step="256"
              @update:value="setMaxTokens"
            />
          </div>

          <div class="setting-item">
            <label>System Prompt</label>
            <n-input
              v-model:value="settings.systemPrompt"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 6 }"
              placeholder="Enter system prompt..."
              @update:value="setSystemPrompt"
            />
          </div>
        </div>
      </n-tab-pane>

      <n-tab-pane name="about" tab="About">
        <div class="settings-section">
          <h3>AI-VIBE-CHAT-V1</h3>
          <p class="about-text">
            A multi-provider AI chat application built with Vue 3, Nuxt 3, and Naive UI.
          </p>
          <div class="about-features">
            <div class="feature-tag">🔒 AES-GCM Encryption</div>
            <div class="feature-tag">⚡ Real-time Streaming</div>
            <div class="feature-tag">🤖 Multi-provider Support</div>
            <div class="feature-tag">🎨 Glassmorphism UI</div>
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '~/stores/settings'

const settingsStore = useSettingsStore()
const settings = computed(() => settingsStore.app)
const defaultProvider = computed(() => settingsStore.defaultProvider)
const defaultModel = computed(() => settingsStore.defaultModel)

const themeOptions = [
  { label: 'Dark', value: 'dark' },
  { label: 'Light', value: 'light' },
  { label: 'System', value: 'system' },
]

const fontSizeOptions = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
]

const providerOptions = [
  { label: 'OpenRouter', value: 'openrouter' },
  { label: 'MegaLLM', value: 'megallm' },
  { label: 'AgentRouter', value: 'agentrouter' },
  { label: 'Routeway', value: 'routeway' },
]

const modelOptions = [
  { label: 'Grok 4.1 Fast', value: 'x-ai/grok-4.1-fast' },
  { label: 'GLM-4.5 Air', value: 'z-ai/glm-4.5-air' },
  { label: 'DeepSeek Chat v3', value: 'deepseek/deepseek-chat-v3-0324' },
  { label: 'Qwen3 Coder', value: 'qwen/qwen3-coder' },
  { label: 'GPT OSS 20B', value: 'openai/gpt-oss-20b' },
  { label: 'Gemini 2.0 Flash', value: 'google/gemini-2.0-flash-exp' },
]

// Theme actions
function setTheme(theme: 'dark' | 'light' | 'system') {
  settingsStore.setTheme(theme)
}

function setFontSize(size: 'small' | 'medium' | 'large') {
  settingsStore.setFontSize(size)
}

function toggleEnterToSend() {
  settingsStore.toggleEnterToSend()
}

function toggleTimestamps() {
  settingsStore.toggleTimestamps()
}

function toggleTokens() {
  settingsStore.toggleTokens()
}

// Provider actions
function setDefaultProvider(provider: string) {
  settingsStore.setDefaultProvider(provider as any)
}

function setDefaultModel(model: string) {
  settingsStore.setDefaultModel(model)
}

// Parameter actions
function setTemperature(temp: number) {
  settingsStore.setTemperature(temp)
}

function setMaxTokens(tokens: number) {
  settingsStore.setMaxTokens(tokens)
}

function setSystemPrompt(prompt: string) {
  settingsStore.setSystemPrompt(prompt)
}
</script>

<style scoped lang="scss">
.settings-panel {
  padding: 1rem;
}

.settings-section {
  margin-bottom: 2rem;

  h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #f1f5f9;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
}

.setting-item {
  margin-bottom: 1.5rem;

  label {
    display: block;
    font-size: 0.875rem;
    color: #94a3b8;
    margin-bottom: 0.5rem;
  }
}

.about-text {
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.about-features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.feature-tag {
  background: rgba(139, 92, 246, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 20px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: #f1f5f9;
}
</style>
