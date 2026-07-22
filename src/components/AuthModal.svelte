<script>
  import Modal from './Modal.svelte';
  import Button from './Button.svelte';
  import {
    registerWithEmail,
    loginWithEmail,
    loginAnonymous,
    loginWithOAuth
  } from '../lib/appwrite.js';
  import { updateProfile, appStore } from '../stores/app.js';

  export let isOpen = false;
  export let onclose = () => {};

  let activeTab = 'login'; // 'login' | 'register' | 'social'
  let email = '';
  let password = '';
  let name = '';
  let isLoading = false;
  let errorMessage = '';
  let successMessage = '';

  async function handleSubmit() {
    errorMessage = '';
    successMessage = '';
    isLoading = true;

    try {
      if (activeTab === 'login') {
        await loginWithEmail(email, password);
        successMessage = 'Successfully logged in!';
      } else if (activeTab === 'register') {
        const newUser = await registerWithEmail(email, password, name || 'Desk Worker');
        updateProfile({ name: name || newUser.name || 'Friend' });
        successMessage = 'Account created & logged in!';
      }

      setTimeout(() => {
        isLoading = false;
        onclose();
      }, 800);
    } catch (err) {
      isLoading = false;
      errorMessage = err?.message || 'Authentication failed. Please check credentials.';
    }
  }

  async function handleGuestLogin() {
    errorMessage = '';
    isLoading = true;
    try {
      await loginAnonymous();
      successMessage = 'Logged in as Guest!';
      setTimeout(() => {
        isLoading = false;
        onclose();
      }, 800);
    } catch (err) {
      isLoading = false;
      errorMessage = err?.message || 'Guest login failed.';
    }
  }

  function handleOAuth(provider) {
    try {
      loginWithOAuth(provider);
    } catch (err) {
      errorMessage = `OAuth login failed for ${provider}: ${err?.message || err}`;
    }
  }
</script>

{#if isOpen}
  <Modal {isOpen} title="Appwrite Cloud Authentication" {onclose}>
    <div class="auth-tabs">
      <button
        class="tab-btn {activeTab === 'login' ? 'active' : ''}"
        on:click={() => { activeTab = 'login'; errorMessage = ''; }}
      >
        Sign In
      </button>
      <button
        class="tab-btn {activeTab === 'register' ? 'active' : ''}"
        on:click={() => { activeTab = 'register'; errorMessage = ''; }}
      >
        Register
      </button>
      <button
        class="tab-btn {activeTab === 'social' ? 'active' : ''}"
        on:click={() => { activeTab = 'social'; errorMessage = ''; }}
      >
        Quick / Social
      </button>
    </div>

    {#if errorMessage}
      <div class="alert alert-error">
        <span class="material-symbols-outlined alert-icon">error</span>
        <span>{errorMessage}</span>
      </div>
    {/if}

    {#if successMessage}
      <div class="alert alert-success">
        <span class="material-symbols-outlined alert-icon">check_circle</span>
        <span>{successMessage}</span>
      </div>
    {/if}

    {#if activeTab === 'login' || activeTab === 'register'}
      <form on:submit|preventDefault={handleSubmit} class="auth-form">
        {#if activeTab === 'register'}
          <div class="form-group">
            <label for="auth-name">Your Full Name</label>
            <input
              type="text"
              id="auth-name"
              bind:value={name}
              placeholder="e.g. Alex Taylor"
              required
            />
          </div>
        {/if}

        <div class="form-group">
          <label for="auth-email">Email Address</label>
          <input
            type="email"
            id="auth-email"
            bind:value={email}
            placeholder="name@example.com"
            required
          />
        </div>

        <div class="form-group">
          <label for="auth-password">Password</label>
          <input
            type="password"
            id="auth-password"
            bind:value={password}
            placeholder="••••••••"
            minlength="8"
            required
          />
        </div>

        <div class="submit-btn-wrap">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={isLoading}
            icon={activeTab === 'login' ? 'login' : 'person_add'}
          >
            {isLoading ? 'Connecting...' : activeTab === 'login' ? 'Sign In to Account' : 'Create Account'}
          </Button>
        </div>
      </form>
    {:else if activeTab === 'social'}
      <div class="social-options">
        <p class="social-desc">Choose a quick authentication method:</p>

        <Button
          variant="outline"
          size="md"
          fullWidth
          icon="account_circle"
          disabled={isLoading}
          onclick={handleGuestLogin}
        >
          {isLoading ? 'Creating Session...' : 'Continue as Guest (Anonymous Session)'}
        </Button>

        <div class="divider">
          <span>OR OAuth Social</span>
        </div>

        <div class="oauth-grid">
          <button class="oauth-btn google" on:click={() => handleOAuth('google')}>
            <span class="material-symbols-outlined">g_translate</span>
            <span>Google Login</span>
          </button>
          <button class="oauth-btn github" on:click={() => handleOAuth('github')}>
            <span class="material-symbols-outlined">code</span>
            <span>GitHub Login</span>
          </button>
        </div>
      </div>
    {/if}
  </Modal>
{/if}

<style>
  .auth-tabs {
    display: flex;
    background: var(--primary-light);
    padding: 4px;
    border-radius: var(--radius-sm);
    margin-bottom: 16px;
    gap: 4px;
  }

  .tab-btn {
    flex: 1;
    background: transparent;
    border: none;
    padding: 8px 12px;
    border-radius: 10px;
    font-size: 0.84rem;
    font-weight: 700;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .tab-btn.active {
    background: var(--bg-card);
    color: var(--primary);
    box-shadow: var(--shadow-sm);
  }

  .alert {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 14px;
  }

  .alert-error {
    background: var(--rose-light);
    color: var(--rose);
  }

  .alert-success {
    background: var(--emerald-light);
    color: var(--emerald);
  }

  .alert-icon {
    font-size: 20px;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  label {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--text-heading);
  }

  input {
    width: 100%;
    padding: 11px 14px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-card);
    font-size: 0.92rem;
    font-family: inherit;
    background: var(--bg-card);
    color: var(--text-heading);
    box-sizing: border-box;
    outline: none;
    transition: border-color 0.2s;
  }

  input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-glow);
  }

  .submit-btn-wrap {
    margin-top: 6px;
  }

  .social-options {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .social-desc {
    margin: 0;
    font-size: 0.86rem;
    color: var(--text-muted);
  }

  .divider {
    display: flex;
    align-items: center;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.76rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 4px 0;
  }

  .divider::before, .divider::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid var(--border-card);
  }

  .divider span {
    padding: 0 10px;
  }

  .oauth-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .oauth-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-card);
    background: var(--bg-card);
    color: var(--text-heading);
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .oauth-btn:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
    border-color: var(--primary);
  }
</style>
