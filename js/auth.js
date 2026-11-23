(() => {
  const cfg = window.PEELVERSE_AUTH_CONFIG || {};
  const SUPABASE_URL = cfg.SUPABASE_URL;
  const SUPABASE_ANON_KEY = cfg.SUPABASE_ANON_KEY;

  if (!window.supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[PEELVERSE Auth] Supabase SDK hoặc auth-config.js chưa sẵn sàng.');
    return;
  }

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let currentUser = null;
  let currentProfile = null;
  let pendingSignupEmail = '';
  let pendingSignupMeta = null;
  let resendCountdownTimer = null;
  let resendSecondsLeft = 0;

  // ===== ERROR TRANSLATION (VIETNAMESE) =====
  function translateAuthError(error) {
    const raw = String((error && (error.message || error.error_description)) || '').toLowerCase();
    if (raw.includes('invalid login credentials')) {
      return 'Email hoặc mật khẩu chưa chính xác. Vui lòng kiểm tra lại!';
    }
    if (raw.includes('email not confirmed')) {
      return 'Email chưa được xác thực. Hãy kiểm tra hộp thư hoặc đăng ký lại để nhận mã 6 số.';
    }
    if (raw.includes('user already registered') || raw.includes('already been registered')) {
      return 'Email này đã được đăng ký tài khoản. Vui lòng chuyển sang tab Đăng nhập!';
    }
    if (raw.includes('token has expired') || raw.includes('expired')) {
      return 'Mã xác nhận 6 số đã hết hạn. Vui lòng bấm "Gửi lại mã" để nhận mã mới.';
    }
    if (raw.includes('invalid') && (raw.includes('otp') || raw.includes('token'))) {
      return 'Mã xác nhận 6 số chưa đúng. Vui lòng kiểm tra lại email và nhập chính xác.';
    }
    if (raw.includes('rate limit') || raw.includes('too many requests') || raw.includes('for security purposes')) {
      return 'Bạn thao tác quá nhanh. Vui lòng chờ vài chục giây rồi thử lại nhé!';
    }
    if (raw.includes('password') && raw.includes('6')) {
      return 'Mật khẩu phải có ít nhất 6 ký tự.';
    }
    if (raw.includes('valid email') || raw.includes('invalid email')) {
      return 'Định dạng email chưa hợp lệ. Vui lòng kiểm tra lại.';
    }
    if (raw.includes('failed to fetch') || raw.includes('network')) {
      return 'Không thể kết nối máy chủ xác thực. Vui lòng kiểm tra mạng Internet.';
    }
    return error && error.message ? error.message : 'Đã có lỗi xảy ra. Vui lòng thử lại!';
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }

  function getEl(id) {
    return document.getElementById(id);
  }

  function setAlert(type, message) {
    const box = getEl('authAlert');
    if (!box) return;
    if (!message) {
      box.className = 'auth-alert hidden';
      box.textContent = '';
      return;
    }
    box.className = `auth-alert auth-alert-${type}`;
    box.textContent = message;
  }

  function setButtonLoading(btn, loading, defaultText) {
    if (!btn) return;
    if (loading) {
      btn.disabled = true;
      btn.dataset.origText = btn.textContent;
      btn.innerHTML = '<span class="auth-spinner" aria-hidden="true"></span>Đang xử lý...';
    } else {
      btn.disabled = false;
      btn.textContent = defaultText || btn.dataset.origText || 'Tiếp tục';
    }
  }

  function showAuthToast(msg, type = 'warning') {
    const container = getEl('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    while (container.children.length > 3) {
      container.firstElementChild.remove();
    }
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = '0.22s ease';
      setTimeout(() => toast.remove(), 230);
    }, 2800);
  }

  function cleanOAuthUrlParams() {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const hasAuthTokens =
      hash.includes('access_token=') ||
      hash.includes('refresh_token=') ||
      hash.includes('error=') ||
      search.includes('code=') ||
      search.includes('error=');
    if (hasAuthTokens && window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  function checkOAuthReturnError() {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
    const err = searchParams.get('error') || hashParams.get('error');
    const errDesc = searchParams.get('error_description') || hashParams.get('error_description') || '';
    if (!err) return;
    const isCancel =
      err === 'access_denied' ||
      errDesc.toLowerCase().includes('cancel') ||
      errDesc.toLowerCase().includes('denied');
    const msg = isCancel
      ? 'Bạn đã hủy đăng nhập bằng Google. Bạn có thể thử lại bất cứ lúc nào!'
      : translateAuthError({ message: errDesc || err });
    setAlert('error', msg);
    showAuthToast(`${msg}`, 'warning');
    cleanOAuthUrlParams();
  }

  // ===== SWITCH AUTH VIEWS =====
  function showAuthPanel(panel) {
    // panel: 'login' | 'signup' | 'otp' | 'forgot'
    setAlert('', '');
    const tabsWrap = getEl('authTabsWrap');
    const loginForm = getEl('authLoginForm');
    const signupForm = getEl('authSignupForm');
    const oauthSection = getEl('authOauthSection');
    const otpView = getEl('authOtpView');
    const forgotForm = getEl('authForgotForm');

    if (tabsWrap) tabsWrap.classList.toggle('hidden', panel === 'otp' || panel === 'forgot');
    if (loginForm) loginForm.classList.toggle('hidden', panel !== 'login');
    if (signupForm) signupForm.classList.toggle('hidden', panel !== 'signup');
    if (oauthSection) oauthSection.classList.toggle('hidden', panel !== 'login' && panel !== 'signup');
    if (otpView) otpView.classList.toggle('hidden', panel !== 'otp');
    if (forgotForm) forgotForm.classList.toggle('hidden', panel !== 'forgot');

    document.querySelectorAll('.auth-tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.authTab === panel);
    });

    if (panel === 'otp') {
      const firstOtp = document.querySelector('.otp-input');
      if (firstOtp) setTimeout(() => firstOtp.focus(), 60);
    }
  }

  function startResendCountdown(seconds = 60) {
    clearInterval(resendCountdownTimer);
    resendSecondsLeft = seconds;
    const btn = getEl('authResendOtpBtn');
    const updateLabel = () => {
      if (!btn) return;
      if (resendSecondsLeft > 0) {
        btn.disabled = true;
        btn.textContent = `Gửi lại mã (${resendSecondsLeft}s)`;
      } else {
        btn.disabled = false;
        btn.textContent = 'Gửi lại mã xác nhận';
      }
    };
    updateLabel();
    resendCountdownTimer = setInterval(() => {
      resendSecondsLeft -= 1;
      updateLabel();
      if (resendSecondsLeft <= 0) clearInterval(resendCountdownTimer);
    }, 1000);
  }

  // ===== GATE & HEADER ACCOUNT UI =====
  function hideAuthGate() {
    const gate = getEl('authGate');
    if (!gate) return;
    gate.classList.add('auth-gate-hidden');
    gate.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('auth-locked');
  }

  function showAuthGate() {
    const gate = getEl('authGate');
    if (!gate) return;
    gate.classList.remove('auth-gate-hidden');
    gate.setAttribute('aria-hidden', 'false');
    document.body.classList.add('auth-locked');
  }

  function updateHeaderUser(user) {
    const wrap = getEl('userAccountWrap');
    const initialEl = getEl('userAvatarInitial');
    const avatarImg = getEl('userAvatarImg');
    const nameEl = getEl('userDisplayName');
    const menuNameEl = getEl('userMenuName');
    const menuEmailEl = getEl('userMenuEmail');

    if (!wrap) return;

    if (!user) {
      wrap.classList.add('hidden');
      const menu = getEl('userAccountMenu');
      if (menu) menu.classList.add('hidden');
      return;
    }

    const meta = user.user_metadata || {};
    const fullName = (meta.full_name || meta.name || '').trim();
    const email = user.email || '';
    const displayName = fullName || (email.split('@')[0] || 'Thành viên');
    const initial = displayName.charAt(0).toUpperCase() || 'P';
    const avatarUrl = meta.avatar_url || meta.picture || '';

    if (initialEl) initialEl.textContent = initial;
    if (avatarImg && initialEl) {
      if (avatarUrl) {
        avatarImg.onerror = () => {
          avatarImg.classList.add('hidden');
          initialEl.classList.remove('hidden');
        };
        avatarImg.onload = () => {
          avatarImg.classList.remove('hidden');
          initialEl.classList.add('hidden');
        };
        avatarImg.src = avatarUrl;
        avatarImg.alt = displayName;
      } else {
        avatarImg.removeAttribute('src');
        avatarImg.classList.add('hidden');
        initialEl.classList.remove('hidden');
      }
    }

    if (nameEl) nameEl.textContent = displayName;
    if (menuNameEl) menuNameEl.textContent = displayName;
    if (menuEmailEl) menuEmailEl.textContent = email;
    wrap.classList.remove('hidden');
  }

  function applyRoleUi(profile) {
    const isCreator = Boolean(profile && profile.role === 'creator');
    const roleBadge = getEl('userRoleBadge');
    const sidebarCreatorItem = getEl('sidebarCreatorItem');
    const userMenuCreatorLink = getEl('userMenuCreatorLink');
    const upgradeBtn = getEl('openUpgradeCreatorBtn');

    if (roleBadge) {
      roleBadge.textContent = isCreator ? 'Nhà sáng tạo' : 'Người dùng';
      roleBadge.className = `user-role-badge ${isCreator ? 'role-creator' : 'role-user'}`;
    }
    if (sidebarCreatorItem) sidebarCreatorItem.classList.toggle('hidden', !isCreator);
    if (userMenuCreatorLink) userMenuCreatorLink.classList.toggle('hidden', !isCreator);
    if (upgradeBtn) upgradeBtn.classList.toggle('hidden', isCreator);

    window.dispatchEvent(
      new CustomEvent('peelverse:auth-ready', {
        detail: { user: currentUser, profile: currentProfile }
      })
    );
  }

  function openRoleOnboardingModal() {
    const ov = getEl('roleOnboardingOverlay');
    if (!ov) return;
    ov.classList.add('open');
    ov.setAttribute('aria-hidden', 'false');
  }

  function closeRoleOnboardingModal() {
    const ov = getEl('roleOnboardingOverlay');
    if (!ov) return;
    ov.classList.remove('open');
    ov.setAttribute('aria-hidden', 'true');
  }

  function openUpgradeCreatorModal() {
    const ov = getEl('upgradeCreatorOverlay');
    const menu = getEl('userAccountMenu');
    if (menu) menu.classList.add('hidden');
    if (!ov) return;
    ov.classList.add('open');
    ov.setAttribute('aria-hidden', 'false');
  }

  function closeUpgradeCreatorModal() {
    const ov = getEl('upgradeCreatorOverlay');
    if (!ov) return;
    ov.classList.remove('open');
    ov.setAttribute('aria-hidden', 'true');
  }

  async function syncUserProfile(user) {
    const creatorApi = window.PEELVERSE_CREATOR;
    if (!user || !creatorApi) return;

    try {
      let profile = await creatorApi.fetchProfile(user.id);
      const meta = user.user_metadata || {};

      // If user just signed up with explicit role metadata, auto-create profile row
      if (!profile && (pendingSignupMeta || meta.role)) {
        const src = pendingSignupMeta || meta;
        profile = await creatorApi.upsertProfile({
          id: user.id,
          full_name: src.full_name || meta.full_name || meta.name || (user.email || '').split('@')[0],
          role: src.role === 'creator' ? 'creator' : 'user',
          shop_name: src.shop_name || '',
          phone: src.phone || ''
        });
        pendingSignupMeta = null;
      }

      if (!profile) {
        // First-time Google OAuth or legacy account without profiles row -> prompt role onboarding
        currentProfile = {
          id: user.id,
          full_name: meta.full_name || meta.name || (user.email || '').split('@')[0],
          role: 'user'
        };
        applyRoleUi(currentProfile);
        openRoleOnboardingModal();
      } else {
        currentProfile = profile;
        closeRoleOnboardingModal();
        applyRoleUi(currentProfile);
      }
    } catch (err) {
      console.warn('[PEELVERSE Auth] Profile sync warning:', err);
      const meta = user.user_metadata || {};
      currentProfile = {
        id: user.id,
        full_name: meta.full_name || meta.name || (user.email || '').split('@')[0],
        role: meta.role === 'creator' ? 'creator' : 'user',
        shop_name: meta.shop_name || '',
        phone: meta.phone || ''
      };
      applyRoleUi(currentProfile);
    }
  }

  function applySession(session) {
    if (session && session.user) {
      const sameUser = currentUser && currentUser.id === session.user.id;
      currentUser = session.user;
      updateHeaderUser(session.user);
      hideAuthGate();
      cleanOAuthUrlParams();
      if (!sameUser || !currentProfile) {
        syncUserProfile(session.user);
      }
    } else {
      currentUser = null;
      currentProfile = null;
      updateHeaderUser(null);
      applyRoleUi(null);
      closeRoleOnboardingModal();
      closeUpgradeCreatorModal();
      showAuthGate();
    }
  }

  // ===== 6-DIGIT OTP INPUT INTERACTION =====
  function setupOtpInputs() {
    const inputs = Array.from(document.querySelectorAll('.otp-input'));
    if (inputs.length === 0) return;

    inputs.forEach((input, idx) => {
      input.addEventListener('input', (e) => {
        const digits = e.target.value.replace(/\D/g, '');
        if (!digits) {
          e.target.value = '';
          return;
        }
        // Handle multi-char input / autofill
        if (digits.length > 1) {
          digits.split('').slice(0, 6 - idx).forEach((ch, offset) => {
            if (inputs[idx + offset]) inputs[idx + offset].value = ch;
          });
          const nextFocus = Math.min(inputs.length - 1, idx + digits.length);
          inputs[nextFocus].focus();
          return;
        }
        e.target.value = digits[0];
        if (idx < inputs.length - 1) {
          inputs[idx + 1].focus();
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && idx > 0) {
          inputs[idx - 1].value = '';
          inputs[idx - 1].focus();
        } else if (e.key === 'ArrowLeft' && idx > 0) {
          inputs[idx - 1].focus();
        } else if (e.key === 'ArrowRight' && idx < inputs.length - 1) {
          inputs[idx + 1].focus();
        }
      });

      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;
        pasted.split('').forEach((ch, i) => {
          if (inputs[i]) inputs[i].value = ch;
        });
        const focusIdx = Math.min(inputs.length - 1, pasted.length - 1);
        if (inputs[focusIdx]) inputs[focusIdx].focus();
      });
    });
  }

  function getOtpCode() {
    return Array.from(document.querySelectorAll('.otp-input'))
      .map((el) => el.value.trim())
      .join('');
  }

  function clearOtpInputs() {
    document.querySelectorAll('.otp-input').forEach((el) => {
      el.value = '';
    });
  }

  // ===== INIT AUTH MODULE =====
  document.addEventListener('DOMContentLoaded', async () => {
    setupOtpInputs();

    // Tab switching
    document.querySelectorAll('.auth-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => showAuthPanel(btn.dataset.authTab));
    });

    // Show/hide password toggles
    document.querySelectorAll('[data-toggle-pw]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = getEl(btn.dataset.togglePw);
        if (!target) return;
        const isHidden = target.type === 'password';
        target.type = isHidden ? 'text' : 'password';
        btn.innerHTML = isHidden
          ? '<i class="ph-duotone ph-eye-slash pv-duotone" style="font-size:18px;"></i>'
          : '<i class="ph-duotone ph-eye pv-duotone" style="font-size:18px;"></i>';
      });
    });

    // Forgot password navigation
    const openForgotBtn = getEl('openForgotBtn');
    const backToLoginFromForgot = getEl('backToLoginFromForgot');
    const backToSignupFromOtp = getEl('backToSignupFromOtp');

    if (openForgotBtn) openForgotBtn.addEventListener('click', () => showAuthPanel('forgot'));
    if (backToLoginFromForgot) backToLoginFromForgot.addEventListener('click', () => showAuthPanel('login'));
    if (backToSignupFromOtp) {
      backToSignupFromOtp.addEventListener('click', () => {
        clearInterval(resendCountdownTimer);
        showAuthPanel('signup');
      });
    }

    // 1. LOGIN SUBMIT
    const loginForm = getEl('authLoginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        setAlert('', '');
        const email = getEl('loginEmail').value.trim();
        const password = getEl('loginPassword').value;
        if (!isValidEmail(email)) {
          setAlert('error', 'Vui lòng nhập đúng định dạng email.');
          return;
        }
        if (password.length < 6) {
          setAlert('error', 'Mật khẩu phải có tối thiểu 6 ký tự.');
          return;
        }
        const submitBtn = getEl('loginSubmitBtn');
        setButtonLoading(submitBtn, true);
        try {
          const { data, error } = await sb.auth.signInWithPassword({ email, password });
          if (error) {
            setAlert('error', translateAuthError(error));
          } else if (data && data.session) {
            applySession(data.session);
          }
        } catch (err) {
          setAlert('error', translateAuthError(err));
        } finally {
          setButtonLoading(submitBtn, false, 'Đăng nhập vào PEELVERSE');
        }
      });
    }

    // Role selector on Signup Form
    document.querySelectorAll('[data-signup-role]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const chosen = btn.dataset.signupRole;
        const hiddenRole = getEl('signupRole');
        const creatorFields = getEl('signupCreatorFields');
        if (hiddenRole) hiddenRole.value = chosen;
        document.querySelectorAll('[data-signup-role]').forEach((b) => {
          const active = b.dataset.signupRole === chosen;
          b.classList.toggle('active', active);
          b.setAttribute('aria-pressed', String(active));
        });
        if (creatorFields) creatorFields.classList.toggle('hidden', chosen !== 'creator');
      });
    });

    // Role selector on Onboarding Modal (for Google OAuth / existing accounts)
    document.querySelectorAll('[data-onboard-role]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const chosen = btn.dataset.onboardRole;
        const hiddenRole = getEl('onboardRoleValue');
        const creatorFields = getEl('onboardCreatorFields');
        if (hiddenRole) hiddenRole.value = chosen;
        document.querySelectorAll('[data-onboard-role]').forEach((b) => {
          b.classList.toggle('active', b.dataset.onboardRole === chosen);
        });
        if (creatorFields) creatorFields.classList.toggle('hidden', chosen !== 'creator');
      });
    });

    const onboardForm = getEl('roleOnboardingForm');
    if (onboardForm) {
      onboardForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser || !window.PEELVERSE_CREATOR) return;
        const role = getEl('onboardRoleValue').value === 'creator' ? 'creator' : 'user';
        const shopName = (getEl('onboardShopName').value || '').trim();
        const phone = (getEl('onboardPhone').value || '').trim();
        if (role === 'creator' && (!shopName || !phone)) {
          showAuthToast('Vui lòng nhập Tên gian hàng và Số điện thoại liên hệ!', 'warning');
          return;
        }
        const btn = getEl('onboardSubmitBtn');
        setButtonLoading(btn, true);
        try {
          const meta = currentUser.user_metadata || {};
          const saved = await window.PEELVERSE_CREATOR.upsertProfile({
            id: currentUser.id,
            full_name: meta.full_name || meta.name || (currentUser.email || '').split('@')[0],
            role,
            shop_name: shopName,
            phone
          });
          currentProfile = saved;
          closeRoleOnboardingModal();
          applyRoleUi(currentProfile);
          showAuthToast(
            role === 'creator'
              ? 'Chào mừng Nhà sáng tạo! Kênh Nhà sáng tạo đã sẵn sàng trên Sidebar.'
              : 'Đã lưu hồ sơ Người dùng PEELVERSE!',
            'success'
          );
        } catch (err) {
          showAuthToast(`${window.PEELVERSE_CREATOR.translateDbError(err)}`, 'warning');
        } finally {
          setButtonLoading(btn, false, 'Lưu vai trò & Vào PEELVERSE →');
        }
      });
    }

    // Upgrade User ->Creator Modal
    const openUpgradeBtn = getEl('openUpgradeCreatorBtn');
    const closeUpgradeBtn = getEl('closeUpgradeCreatorBtn');
    const upgradeOverlay = getEl('upgradeCreatorOverlay');
    const upgradeForm = getEl('upgradeCreatorForm');

    if (openUpgradeBtn) openUpgradeBtn.addEventListener('click', openUpgradeCreatorModal);
    if (closeUpgradeBtn) closeUpgradeBtn.addEventListener('click', closeUpgradeCreatorModal);
    if (upgradeOverlay) {
      upgradeOverlay.addEventListener('click', (e) => {
        if (e.target === upgradeOverlay) closeUpgradeCreatorModal();
      });
    }

    if (upgradeForm) {
      upgradeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser || !window.PEELVERSE_CREATOR) return;
        const shopName = (getEl('upgradeShopName').value || '').trim();
        const phone = (getEl('upgradePhone').value || '').trim();
        if (!shopName || !phone) {
          showAuthToast('Vui lòng nhập đầy đủ Tên gian hàng và SĐT!', 'warning');
          return;
        }
        const btn = getEl('upgradeCreatorSubmitBtn');
        setButtonLoading(btn, true);
        try {
          const meta = currentUser.user_metadata || {};
          const saved = await window.PEELVERSE_CREATOR.upsertProfile({
            id: currentUser.id,
            full_name: (currentProfile && currentProfile.full_name) || meta.full_name || meta.name || (currentUser.email || '').split('@')[0],
            role: 'creator',
            shop_name: shopName,
            phone
          });
          currentProfile = saved;
          closeUpgradeCreatorModal();
          applyRoleUi(currentProfile);
          showAuthToast('Nâng cấp thành công! Bạn đã là Nhà sáng tạo PEELVERSE.', 'success');
        } catch (err) {
          showAuthToast(`${window.PEELVERSE_CREATOR.translateDbError(err)}`, 'warning');
        } finally {
          setButtonLoading(btn, false, 'Kích hoạt Kênh Nhà sáng tạo →');
        }
      });
    }

    // 2. SIGNUP SUBMIT ->SEND 6-DIGIT EMAIL OTP
    const signupForm = getEl('authSignupForm');
    if (signupForm) {
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        setAlert('', '');
        const role = (getEl('signupRole') && getEl('signupRole').value) === 'creator' ? 'creator' : 'user';
        const fullName = getEl('signupName').value.trim();
        const shopName = getEl('signupShopName') ? getEl('signupShopName').value.trim() : '';
        const phone = getEl('signupPhone') ? getEl('signupPhone').value.trim() : '';
        const email = getEl('signupEmail').value.trim();
        const password = getEl('signupPassword').value;

        if (fullName.length < 2) {
          setAlert('error', 'Vui lòng nhập Họ và tên (tối thiểu 2 ký tự).');
          return;
        }
        if (role === 'creator' && (!shopName || !phone)) {
          setAlert('error', 'Với vai trò Nhà sáng tạo, vui lòng nhập Tên gian hàng và Số điện thoại liên hệ.');
          return;
        }
        if (!isValidEmail(email)) {
          setAlert('error', 'Vui lòng nhập đúng định dạng email.');
          return;
        }
        if (password.length < 6) {
          setAlert('error', 'Mật khẩu phải có tối thiểu 6 ký tự.');
          return;
        }

        const submitBtn = getEl('signupSubmitBtn');
        setButtonLoading(submitBtn, true);
        try {
          pendingSignupMeta = { full_name: fullName, role, shop_name: shopName, phone };
          const { data, error } = await sb.auth.signUp({
            email,
            password,
            options: {
              data: pendingSignupMeta
            }
          });
          if (error) {
            setAlert('error', translateAuthError(error));
            return;
          }
          // Detect already-registered email (Supabase returns empty identities array)
          if (data && data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
            setAlert('error', 'Email này đã được đăng ký tài khoản. Vui lòng chuyển sang tab Đăng nhập!');
            return;
          }
          if (data && data.session) {
            applySession(data.session);
            return;
          }
          // Transition to 6-digit OTP verification
          pendingSignupEmail = email;
          const emailTarget = getEl('otpEmailDisplay');
          if (emailTarget) emailTarget.textContent = email;
          clearOtpInputs();
          showAuthPanel('otp');
          setAlert('success', `Đã gửi mã xác nhận 6 số đến ${email}. Vui lòng kiểm tra hộp thư (kể cả mục Spam/Quảng cáo).`);
          startResendCountdown(60);
        } catch (err) {
          setAlert('error', translateAuthError(err));
        } finally {
          setButtonLoading(submitBtn, false, 'Đăng ký & Nhận mã 6 số');
        }
      });
    }

    // 3. VERIFY 6-DIGIT OTP
    const otpForm = getEl('authOtpForm');
    if (otpForm) {
      otpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        setAlert('', '');
        const token = getOtpCode();
        if (token.length !== 6) {
          setAlert('error', 'Vui lòng nhập đủ 6 chữ số xác nhận từ email.');
          return;
        }
        const submitBtn = getEl('verifyOtpBtn');
        setButtonLoading(submitBtn, true);
        try {
          const { data, error } = await sb.auth.verifyOtp({
            email: pendingSignupEmail,
            token,
            type: 'signup'
          });
          if (error) {
            setAlert('error', translateAuthError(error));
          } else if (data && data.session) {
            clearInterval(resendCountdownTimer);
            applySession(data.session);
          } else {
            setAlert('success', 'Xác thực thành công! Đang chuyển vào PEELVERSE...');
            const { data: sData } = await sb.auth.getSession();
            if (sData && sData.session) applySession(sData.session);
          }
        } catch (err) {
          setAlert('error', translateAuthError(err));
        } finally {
          setButtonLoading(submitBtn, false, 'Xác nhận mã & Kích hoạt');
        }
      });
    }

    // 4. RESEND OTP
    const resendBtn = getEl('authResendOtpBtn');
    if (resendBtn) {
      resendBtn.addEventListener('click', async () => {
        if (!pendingSignupEmail || resendSecondsLeft > 0) return;
        setAlert('', '');
        resendBtn.disabled = true;
        try {
          const { error } = await sb.auth.resend({
            type: 'signup',
            email: pendingSignupEmail
          });
          if (error) {
            setAlert('error', translateAuthError(error));
            resendBtn.disabled = false;
          } else {
            setAlert('success', `Đã gửi lại mã xác nhận mới đến ${pendingSignupEmail}!`);
            startResendCountdown(60);
          }
        } catch (err) {
          setAlert('error', translateAuthError(err));
          resendBtn.disabled = false;
        }
      });
    }

    // 5. FORGOT PASSWORD
    const forgotForm = getEl('authForgotForm');
    if (forgotForm) {
      forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        setAlert('', '');
        const email = getEl('forgotEmail').value.trim();
        if (!isValidEmail(email)) {
          setAlert('error', 'Vui lòng nhập đúng định dạng email để đặt lại mật khẩu.');
          return;
        }
        const submitBtn = getEl('forgotSubmitBtn');
        setButtonLoading(submitBtn, true);
        try {
          const { error } = await sb.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + window.location.pathname
          });
          if (error) {
            setAlert('error', translateAuthError(error));
          } else {
            setAlert('success', `Đã gửi liên kết đặt lại mật khẩu đến ${email}. Vui lòng kiểm tra hộp thư!`);
          }
        } catch (err) {
          setAlert('error', translateAuthError(err));
        } finally {
          setButtonLoading(submitBtn, false, 'Gửi liên kết đặt lại mật khẩu');
        }
      });
    }

    // 5b. GOOGLE OAUTH LOGIN
    const googleAuthBtn = getEl('googleAuthBtn');
    if (googleAuthBtn) {
      googleAuthBtn.addEventListener('click', async () => {
        setAlert('', '');
        googleAuthBtn.disabled = true;
        const origHtml = googleAuthBtn.innerHTML;
        googleAuthBtn.innerHTML = '<span class="auth-spinner dark" aria-hidden="true"></span> <span>Đang chuyển hướng sang Google...</span>';
        try {
          const { error } = await sb.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: window.location.origin + window.location.pathname
            }
          });
          if (error) {
            const msg = translateAuthError(error);
            setAlert('error', msg);
            showAuthToast(`${msg}`, 'warning');
            googleAuthBtn.disabled = false;
            googleAuthBtn.innerHTML = origHtml;
          }
        } catch (err) {
          const msg = translateAuthError(err);
          setAlert('error', msg);
          showAuthToast(`${msg}`, 'warning');
          googleAuthBtn.disabled = false;
          googleAuthBtn.innerHTML = origHtml;
        }
      });
    }

    // Check OAuth error callback if user canceled or provider returned error
    checkOAuthReturnError();

    // 6. HEADER ACCOUNT DROPDOWN & SIGN OUT
    const accountBtn = getEl('userAccountBtn');
    const accountMenu = getEl('userAccountMenu');
    const signOutBtn = getEl('userSignOutBtn');

    if (accountBtn && accountMenu) {
      accountBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        accountMenu.classList.toggle('hidden');
      });
      document.addEventListener('click', (e) => {
        if (!e.target.closest('#userAccountWrap')) {
          accountMenu.classList.add('hidden');
        }
      });
    }

    if (signOutBtn) {
      signOutBtn.addEventListener('click', async () => {
        signOutBtn.disabled = true;
        try {
          await sb.auth.signOut();
          if (accountMenu) accountMenu.classList.add('hidden');
          showAuthPanel('login');
          showAuthGate();
        } finally {
          signOutBtn.disabled = false;
        }
      });
    }

    // Check initial session & subscribe to auth state changes
    try {
      const { data } = await sb.auth.getSession();
      applySession(data ? data.session : null);
    } catch {
      showAuthGate();
    }

    sb.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });
  });

  window.PEELVERSE_AUTH = {
    supabase: sb,
    getUser: () => currentUser,
    getProfile: () => currentProfile,
    openUpgradeModal: openUpgradeCreatorModal
  };
})();
