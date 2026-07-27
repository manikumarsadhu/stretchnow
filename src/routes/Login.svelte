<script>
  import Button from '../components/Button.svelte';
  import Card from '../components/Card.svelte';
  import { loginWithOAuth, loginWithEmail, registerWithEmail, loginAnonymous } from '../lib/appwrite.js';
  import { navigateTo, checkAndSyncAuth, updateProfile } from '../stores/app.js';

  let mode = 'social'; // 'social' | 'email' | 'register'
  let email = '';
  let password = '';
  let name = '';
  let isLoading = false;
  let errorMsg = '';

  function handleGoogleLogin() {
    errorMsg = '';
    try {
      loginWithOAuth('google');
    } catch (err) {
      errorMsg = 'Failed to initiate Gmail login. Please try again.';
    }
  }

  async function handleEmailAuth(e) {
    e.preventDefault();
    errorMsg = '';
    isLoading = true;

    try {
      if (mode === 'email') {
        await loginWithEmail(email, password);
      } else if (mode === 'register') {
        const user = await registerWithEmail(email, password, name || 'Desk Worker');
        updateProfile({ name: name || user.name || 'Friend' });
      }
      await checkAndSyncAuth();
      isLoading = false;
      navigateTo('home');
    } catch (err) {
      isLoading = false;
      errorMsg = err?.message || 'Authentication error. Please check credentials.';
    }
  }

  async function handleGuest() {
    errorMsg = '';
    isLoading = true;
    try {
      await loginAnonymous();
      await checkAndSyncAuth();
      isLoading = false;
      navigateTo('home');
    } catch (err) {
      isLoading = false;
      navigateTo('home');
    }
  }
</script>

<div class="login-screen animate-fade-in">
  <div class="header">
    <div class="logo-box">
      <img src="/icon-192.png" alt="StretchNow App Logo" class="logo-img" />
    </div>
    <h2 class="title">Welcome to StretchNow</h2>
    <p class="subtitle">Sign in to load your personalized posture stats & streak progress.</p>
  </div>

  <Card padding="lg">
    <div class="auth-container">
      {#if errorMsg}
        <div class="error-banner">
          <span class="material-symbols-outlined">error</span>
          <span>{errorMsg}</span>
        </div>
      {/if}

      <!-- Main Gmail Google Login Button -->
      <button class="gmail-btn" on:click={handleGoogleLogin}>
        <div class="gmail-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
        </div>
        <span class="gmail-btn-text">Continue with Gmail (Google)</span>
      </button>

      <div class="divider">
        <span>OR</span>
      </div>

      {#if mode === 'social'}
        <div class="alt-options">
          <Button variant="outline" size="md" fullWidth icon="mail" onclick={() => mode = 'email'}>
            Sign in with Email
          </Button>

          <button class="guest-btn" on:click={handleGuest}>
            Continue as Guest
          </button>
        </div>
      {:else}
        <!-- Email & Password Form -->
        <form on:submit={handleEmailAuth} class="email-form">
          {#if mode === 'register'}
            <div class="form-group">
              <label for="login-name">Your Name</label>
              <input type="text" id="login-name" bind:value={name} placeholder="e.g. Alex" required />
            </div>
          {/if}

          <div class="form-group">
            <label for="login-email">Email Address</label>
            <input type="email" id="login-email" bind:value={email} placeholder="alex@gmail.com" required />
          </div>

          <div class="form-group">
            <label for="login-pass">Password</label>
            <input type="password" id="login-pass" bind:value={password} placeholder="••••••••" required minlength="8" />
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={isLoading} icon={mode === 'email' ? 'login' : 'person_add'}>
            {isLoading ? 'Authenticating...' : mode === 'email' ? 'Sign In' : 'Create Account'}
          </Button>

          <div class="mode-toggle">
            {#if mode === 'email'}
              <span>Don't have an account?</span>
              <button type="button" class="link-btn" on:click={() => mode = 'register'}>Register</button>
            {:else}
              <span>Already have an account?</span>
              <button type="button" class="link-btn" on:click={() => mode = 'email'}>Sign In</button>
            {/if}
            •
            <button type="button" class="link-btn" on:click={() => mode = 'social'}>Back</button>
          </div>
        </form>
      {/if}
    </div>
  </Card>
</div>

<style>
  .login-screen {
    min-height: 100vh;
    padding: 32px 20px 40px;
    max-width: 480px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    background: var(--bg-gradient, transparent);
  }

  .header {
    text-align: center;
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .logo-box {
    width: 64px;
    height: 64px;
    background: var(--primary-light);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
  }

  .logo-img {
    width: 44px;
    height: 44px;
    object-fit: contain;
  }

  .title {
    margin: 0 0 6px;
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--text-heading);
    letter-spacing: -0.02em;
  }

  .subtitle {
    margin: 0;
    font-size: 0.88rem;
    color: var(--text-muted);
    line-height: 1.45;
  }

  .auth-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .error-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--rose-light);
    color: var(--rose);
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    font-size: 0.84rem;
    font-weight: 600;
  }

  .gmail-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 100%;
    padding: 14px 20px;
    background: #ffffff;
    border: 1px solid var(--border-card);
    border-radius: var(--radius-sm);
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  :global(.dark-mode) .gmail-btn {
    background: #1e293b;
    border-color: rgba(51, 65, 85, 0.9);
  }

  .gmail-btn:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--primary);
  }

  .gmail-icon-wrap {
    display: flex;
    align-items: center;
  }

  .gmail-btn-text {
    font-size: 0.98rem;
    font-weight: 700;
    color: var(--text-heading);
  }

  .divider {
    display: flex;
    align-items: center;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.76rem;
    font-weight: 700;
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

  .alt-options {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .guest-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: color 0.2s;
  }

  .guest-btn:hover {
    color: var(--text-heading);
    text-decoration: underline;
  }

  .email-form {
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
    font-size: 0.94rem;
    font-family: inherit;
    background: var(--bg-card);
    color: var(--text-heading);
    box-sizing: border-box;
    outline: none;
  }

  input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-glow);
  }

  .mode-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-top: 4px;
  }

  .link-btn {
    background: transparent;
    border: none;
    color: var(--primary);
    font-weight: 700;
    cursor: pointer;
    padding: 0;
  }

  .link-btn:hover {
    text-decoration: underline;
  }
</style>
