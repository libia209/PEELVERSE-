(() => {
  const cfg = window.PEELVERSE_AUTH_CONFIG || {};
  const SUPABASE_URL = cfg.SUPABASE_URL;
  const SUPABASE_ANON_KEY = cfg.SUPABASE_ANON_KEY;

  if (!window.supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[PEELVERSE KYC] Supabase chưa sẵn sàng.');
    return;
  }

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const MAX_KYC_BYTES = 3 * 1024 * 1024; // 3MB
  const ALLOWED_KYC_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  let currentUser = null;
  let currentProfile = null;
  let currentVerification = null;
  let authMode = 'login'; // 'login' | 'signup' | 'otp'
  let pendingEmail = '';

  function el(id) {
    return document.getElementById(id);
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg, type = 'success') {
    const box = el('toastContainer');
    if (!box) return;
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    box.appendChild(t);
    while (box.children.length > 3) box.firstElementChild.remove();
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateY(8px)';
      t.style.transition = '0.22s ease';
      setTimeout(() => t.remove(), 240);
    }, 3200);
  }

  function maskCccd(cccd) {
    const s = String(cccd || '').replace(/\D/g, '');
    if (s.length <= 4) return '********';
    return '*'.repeat(s.length - 4) + s.slice(-4);
  }

  function calculateAge(dobStr) {
    if (!dobStr) return -1;
    const parts = dobStr.split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return -1;
    const [year, month, day] = parts;
    const today = new Date();
    let age = today.getFullYear() - year;
    const mDiff = today.getMonth() + 1 - month;
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < day)) {
      age -= 1;
    }
    return age;
  }

  function translateError(err) {
    const raw = String((err && (err.message || err.error_description)) || '').toLowerCase();
    if (raw.includes('invalid login credentials')) return 'Email hoặc mật khẩu chưa đúng.';
    if (raw.includes('user already registered') || raw.includes('already been registered')) {
      return 'Email này đã có tài khoản. Vui lòng chuyển sang tab Đăng nhập.';
    }
    if (raw.includes('row-level security')) {
      return 'Tài khoản chưa đủ quyền ghi dữ liệu. Vui lòng kiểm tra cấu hình RLS trên Supabase.';
    }
    if (raw.includes('bucket') || raw.includes('not found')) {
      return 'Bucket lưu trữ kyc-documents hoặc bảng seller_verifications chưa được tạo trên Supabase.';
    }
    return (err && err.message) || 'Đã có lỗi xảy ra, vui lòng thử lại.';
  }

  function updateHeader(user, profile) {
    const wrap = el('sellerHeaderUser');
    if (!wrap) return;
    if (!user) {
      wrap.classList.add('hidden');
      return;
    }
    const name =
      (profile && profile.full_name) ||
      (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) ||
      (user.email || '').split('@')[0] ||
      'Thành viên';
    el('sellerHeaderInitial').textContent = name.charAt(0).toUpperCase();
    el('sellerHeaderName').textContent = name;
    el('sellerMenuName').textContent = name;
    el('sellerMenuEmail').textContent = user.email || '';
    wrap.classList.remove('hidden');
  }

  async function loadUserContext(user) {
    currentUser = user;
    if (!user) {
      currentProfile = null;
      currentVerification = null;
      updateHeader(null, null);
      render();
      return;
    }

    try {
      const { data: prof } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
      currentProfile = prof || null;
    } catch {
      currentProfile = null;
    }

    try {
      const { data: ver } = await sb
        .from('seller_verifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      currentVerification = ver || null;
    } catch {
      currentVerification = null;
    }

    updateHeader(currentUser, currentProfile);
    render();
  }

  function renderAuthBox(mount) {
    mount.innerHTML = `
      <div class="kyc-auth-wrap">
        <div class="pksi__col auth-gate-card" style="margin:0 auto;">
          <div class="pksi__logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="9"/>
              <path d="M12 3v18M3 12h18"/>
            </svg>
          </div>
          <h2 class="pksi__title brand-wordmark">ĐĂNG NHẬP PEELVERSE</h2>
          <p class="pksi__lede">Đăng nhập hoặc tạo tài khoản trước khi gửi hồ sơ xác minh người bán (18+ &amp; CCCD).</p>

          <div class="auth-tabs" role="tablist" style="width:100%;">
            <button type="button" class="auth-tab-btn ${authMode === 'login' ? 'active' : ''}" data-kauth-tab="login">Đăng nhập</button>
            <button type="button" class="auth-tab-btn ${authMode === 'signup' ? 'active' : ''}" data-kauth-tab="signup">Đăng ký mới</button>
          </div>

          <div id="kycAuthAlert" class="auth-alert hidden" role="alert" style="width:100%;"></div>

          ${
            authMode === 'otp'
              ? `
            <form id="kycOtpForm" class="pksi__form">
              <p style="font-size:0.86rem;color:var(--text-muted);">Nhập mã 6 số đã gửi tới <strong>${escapeHtml(pendingEmail)}</strong></p>
              <input id="kycOtpCode" class="pksi__input" type="text" inputmode="numeric" maxlength="6" required placeholder="Nhập 6 chữ số OTP" style="text-align:center;letter-spacing:0.25em;font-weight:700;" />
              <button type="submit" id="kycOtpBtn" class="pksi__submit">Xác nhận mã &amp; Tiếp tục</button>
              <button type="button" id="kycBackSignupBtn" class="auth-link-btn muted">← Quay lại</button>
            </form>
          `
              : authMode === 'signup'
              ? `
            <form id="kycSignupForm" class="pksi__form">
              <input id="kycSuName" class="pksi__input" type="text" required placeholder="Họ và tên" />
              <input id="kycSuEmail" class="pksi__input" type="email" required placeholder="Email của bạn" />
              <input id="kycSuPass" class="pksi__input" type="password" required minlength="6" placeholder="Mật khẩu (tối thiểu 6 ký tự)" />
              <button type="submit" id="kycSuBtn" class="pksi__submit">Đăng ký &amp; Nhận mã 6 số</button>
            </form>
          `
              : `
            <form id="kycLoginForm" class="pksi__form">
              <input id="kycLiEmail" class="pksi__input" type="email" required placeholder="Email tài khoản PEELVERSE" />
              <input id="kycLiPass" class="pksi__input" type="password" required minlength="6" placeholder="Mật khẩu" />
              <button type="submit" id="kycLiBtn" class="pksi__submit">Đăng nhập để xác minh bán hàng</button>
            </form>
          `
          }

          <div class="pksi__or">
            <span class="pksi__rule"></span><span>hoặc</span><span class="pksi__rule"></span>
          </div>
          <button type="button" id="kycGoogleBtn" class="pksi__provider" style="width:100%;">
            <span class="pksi__provider-icon" aria-hidden="true">
              <svg viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            </span>
            <span class="pksi__provider-name">Tiếp tục với Google</span>
          </button>
        </div>
      </div>
    `;

    const setKycAlert = (msg) => {
      const box = el('kycAuthAlert');
      if (!box) return;
      if (!msg) {
        box.className = 'auth-alert hidden';
        box.textContent = '';
      } else {
        box.className = 'auth-alert auth-alert-error';
        box.textContent = msg;
      }
    };

    mount.querySelectorAll('[data-kauth-tab]').forEach((b) => {
      b.addEventListener('click', () => {
        authMode = b.dataset.kauthTab;
        renderAuthBox(mount);
      });
    });

    const loginForm = el('kycLoginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        setKycAlert('');
        const btn = el('kycLiBtn');
        btn.disabled = true;
        btn.textContent = 'Đang đăng nhập...';
        try {
          const { data, error } = await sb.auth.signInWithPassword({
            email: el('kycLiEmail').value.trim(),
            password: el('kycLiPass').value
          });
          if (error) {
            setKycAlert(translateError(error));
          } else if (data && data.session) {
            await loadUserContext(data.session.user);
          }
        } catch (err) {
          setKycAlert(translateError(err));
        } finally {
          btn.disabled = false;
          btn.textContent = 'Đăng nhập để xác minh bán hàng';
        }
      });
    }

    const signupForm = el('kycSignupForm');
    if (signupForm) {
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        setKycAlert('');
        const fullName = el('kycSuName').value.trim();
        const email = el('kycSuEmail').value.trim();
        const password = el('kycSuPass').value;
        const btn = el('kycSuBtn');
        btn.disabled = true;
        btn.textContent = 'Đang gửi mã...';
        try {
          const { data, error } = await sb.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName, role: 'user' } }
          });
          if (error) {
            setKycAlert(translateError(error));
          } else if (data && data.session) {
            await loadUserContext(data.session.user);
          } else {
            pendingEmail = email;
            authMode = 'otp';
            renderAuthBox(mount);
          }
        } catch (err) {
          setKycAlert(translateError(err));
        } finally {
          btn.disabled = false;
          btn.textContent = 'Đăng ký & Nhận mã 6 số';
        }
      });
    }

    const otpForm = el('kycOtpForm');
    if (otpForm) {
      otpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = el('kycOtpCode').value.trim();
        const btn = el('kycOtpBtn');
        btn.disabled = true;
        try {
          const { data, error } = await sb.auth.verifyOtp({
            email: pendingEmail,
            token: code,
            type: 'signup'
          });
          if (error) setKycAlert(translateError(error));
          else if (data && data.session) await loadUserContext(data.session.user);
        } finally {
          btn.disabled = false;
        }
      });
      const backBtn = el('kycBackSignupBtn');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          authMode = 'signup';
          renderAuthBox(mount);
        });
      }
    }

    const gBtn = el('kycGoogleBtn');
    if (gBtn) {
      gBtn.addEventListener('click', async () => {
        gBtn.disabled = true;
        await sb.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin + window.location.pathname }
        });
      });
    }
  }

  function renderStatusCard(mount, status) {
    if (status === 'verified') {
      mount.innerHTML = `
        <section class="kyc-card kyc-status-card kyc-status-verified">
          <span class="kyc-status-pill verified">ĐÃ XÁC MINH</span>
          <h2 class="serif-heading" style="font-size:1.85rem;margin-top:10px;">Tài khoản bán hàng đã xác minh</h2>
          <p style="color:var(--text-muted);max-width:520px;margin:8px auto 20px;">
            Hồ sơ định danh và gian hàng của bạn đã được phê duyệt. Bạn có thể truy cập Kênh Nhà sáng tạo để đăng sản phẩm và quản lý đơn hàng.
          </p>
          <a href="./index.html?route=creator" class="btn btn-primary">Mở Kênh Nhà sáng tạo →</a>
        </section>
      `;
      return;
    }

    const ver = currentVerification || {};
    mount.innerHTML = `
      <section class="kyc-card kyc-status-card kyc-status-pending">
        <span class="kyc-status-pill pending">ĐANG CHỜ XÉT DUYỆT</span>
        <h2 class="serif-heading" style="font-size:1.75rem;margin-top:10px;">Hồ sơ xác minh đang được xét duyệt (1–2 ngày)</h2>
        <p style="color:var(--text-muted);max-width:540px;margin:8px auto 18px;">
          Cảm ơn bạn đã gửi thông tin. Đội ngũ PEELVERSE đang kiểm tra hồ sơ độ tuổi và CCCD của bạn.
        </p>
        <div class="kyc-summary-grid">
          <div><span>Họ và tên</span><strong>${escapeHtml(ver.full_name || (currentProfile && currentProfile.full_name) || '—')}</strong></div>
          <div><span>Số CCCD</span><strong>${maskCccd(ver.cccd_number)}</strong></div>
          <div><span>Gian hàng</span><strong>${escapeHtml(ver.shop_name || (currentProfile && currentProfile.shop_name) || '—')}</strong></div>
          <div><span>Số điện thoại</span><strong>${escapeHtml(ver.phone || (currentProfile && currentProfile.phone) || '—')}</strong></div>
          <div style="grid-column:1/-1;"><span>Địa chỉ kinh doanh</span><strong>${escapeHtml(ver.business_address || '—')}</strong></div>
        </div>
        <div style="margin-top:20px;">
          <a href="./index.html" class="btn btn-secondary">← Quay lại trang chủ PEELVERSE</a>
        </div>
      </section>
    `;
  }

  async function uploadKycImage(file, side) {
    if (!ALLOWED_KYC_TYPES.includes(file.type)) {
      throw new Error('Ảnh CCCD chỉ hỗ trợ định dạng JPG, PNG hoặc WebP.');
    }
    if (file.size > MAX_KYC_BYTES) {
      throw new Error('Dung lượng mỗi ảnh CCCD tối đa 3MB.');
    }
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const filePath = `${currentUser.id}/cccd-${side}-${Date.now()}.${ext}`;
    const { error } = await sb.storage
      .from('kyc-documents')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    return filePath;
  }

  function renderVerificationForm(mount, isRejected) {
    const ver = currentVerification || {};
    const prefName = ver.full_name || (currentProfile && currentProfile.full_name) || '';
    const prefShop = ver.shop_name || (currentProfile && currentProfile.shop_name) || '';
    const prefPhone = ver.phone || (currentProfile && currentProfile.phone) || '';
    const prefAddr = ver.business_address || '';

    mount.innerHTML = `
      ${
        isRejected
          ? `
        <div class="kyc-rejected-banner" role="alert">
          <strong>Hồ sơ trước đây chưa được duyệt</strong>
          <p>${escapeHtml(ver.review_note || 'Ảnh CCCD hoặc thông tin chưa khớp. Vui lòng kiểm tra và gửi lại hồ sơ bên dưới.')}</p>
        </div>
      `
          : ''
      }

      <form id="kycSellerForm" class="kyc-card" novalidate>
        <div id="kycFormAlert" class="auth-alert hidden" role="alert" style="margin-bottom:16px;"></div>

        <div class="kyc-section">
          <div class="kyc-section-head">
            <span class="eyebrow-tag">PHẦN 01</span>
            <h2 class="serif-heading" style="font-size:1.5rem;">Thông tin định danh &amp; Xác minh độ tuổi (bắt buộc)</h2>
          </div>

          <div class="creator-form-grid">
            <div class="form-field">
              <label for="kycFullName">Họ và tên đúng theo CCCD *</label>
              <input id="kycFullName" type="text" required value="${escapeHtml(prefName)}" placeholder="VD: NGUYEN MINH ANH" />
            </div>

            <div class="form-field">
              <label for="kycDob">Ngày tháng năm sinh (đủ 18 tuổi trở lên) *</label>
              <input id="kycDob" type="date" required value="${escapeHtml(ver.date_of_birth || '')}" />
              <small id="kycAgeHint" class="kyc-hint">Hệ thống tự động kiểm tra đủ 18 tuổi tính đến hôm nay.</small>
            </div>

            <div class="form-field" style="grid-column:1/-1;">
              <label for="kycCccd">Số CCCD (12 chữ số) *</label>
              <input id="kycCccd" type="text" inputmode="numeric" maxlength="12" required value="${escapeHtml(ver.cccd_number || '')}" placeholder="Nhập đúng 12 chữ số căn cước công dân" />
            </div>

            <div class="form-field">
              <label for="kycFrontFile">Ảnh CCCD mặt trước (JPG/PNG/WebP, ≤ 3MB) *</label>
              <input id="kycFrontFile" type="file" accept="image/jpeg,image/png,image/webp" required />
              <div id="kycFrontPreviewWrap" class="cp-preview-wrap hidden">
                <img id="kycFrontPreview" alt="Xem trước CCCD mặt trước" />
              </div>
            </div>

            <div class="form-field">
              <label for="kycBackFile">Ảnh CCCD mặt sau (JPG/PNG/WebP, ≤ 3MB) *</label>
              <input id="kycBackFile" type="file" accept="image/jpeg,image/png,image/webp" required />
              <div id="kycBackPreviewWrap" class="cp-preview-wrap hidden">
                <img id="kycBackPreview" alt="Xem trước CCCD mặt sau" />
              </div>
            </div>
          </div>
        </div>

        <div class="kyc-section" style="margin-top:24px;padding-top:22px;border-top:1px solid var(--border-soft);">
          <div class="kyc-section-head">
            <span class="eyebrow-tag">PHẦN 02</span>
            <h2 class="serif-heading" style="font-size:1.5rem;">Thông tin gian hàng</h2>
          </div>

          <div class="creator-form-grid">
            <div class="form-field">
              <label for="kycShopName">Tên gian hàng / Thương hiệu *</label>
              <input id="kycShopName" type="text" required value="${escapeHtml(prefShop)}" placeholder="VD: Xưởng Xanh Vỏ Cam" />
            </div>

            <div class="form-field">
              <label for="kycPhone">Số điện thoại liên hệ (10 số) *</label>
              <input id="kycPhone" type="tel" inputmode="numeric" maxlength="10" required value="${escapeHtml(prefPhone)}" placeholder="VD: 0355415501" />
            </div>

            <div class="form-field" style="grid-column:1/-1;">
              <label for="kycAddress">Địa chỉ kinh doanh / gửi hàng *</label>
              <input id="kycAddress" type="text" required value="${escapeHtml(prefAddr)}" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" />
            </div>
          </div>

          <label class="kyc-agree-label">
            <input type="checkbox" id="kycAgreeTerms" required />
            <span>Tôi cam đoan thông tin và giấy tờ trên là chính chủ, đúng sự thật và đồng ý cho PEELVERSE sử dụng để xác minh người bán.</span>
          </label>
        </div>

        <div style="display:flex;justify-content:flex-end;margin-top:20px;">
          <button type="submit" id="kycSubmitBtn" class="btn btn-primary">
            Gửi hồ sơ xác minh bán hàng
          </button>
        </div>
      </form>
    `;

    const bindPreview = (inputId, wrapId, imgId) => {
      const inp = el(inputId);
      const wrap = el(wrapId);
      const img = el(imgId);
      if (!inp || !wrap || !img) return;
      inp.addEventListener('change', () => {
        const f = inp.files && inp.files[0];
        if (!f) {
          wrap.classList.add('hidden');
          return;
        }
        if (!ALLOWED_KYC_TYPES.includes(f.type)) {
          toast('Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.', 'warning');
          inp.value = '';
          wrap.classList.add('hidden');
          return;
        }
        if (f.size > MAX_KYC_BYTES) {
          toast('Ảnh vượt quá giới hạn 3MB.', 'warning');
          inp.value = '';
          wrap.classList.add('hidden');
          return;
        }
        img.src = URL.createObjectURL(f);
        wrap.classList.remove('hidden');
      });
    };

    bindPreview('kycFrontFile', 'kycFrontPreviewWrap', 'kycFrontPreview');
    bindPreview('kycBackFile', 'kycBackPreviewWrap', 'kycBackPreview');

    const dobInput = el('kycDob');
    const ageHint = el('kycAgeHint');
    if (dobInput && ageHint) {
      dobInput.addEventListener('change', () => {
        const age = calculateAge(dobInput.value);
        if (age >= 0 && age < 18) {
          ageHint.textContent = 'Người đăng ký bán hàng bắt buộc đủ 18 tuổi trở lên.';
          ageHint.style.color = '#B91C1C';
        } else if (age >= 18) {
          ageHint.textContent = `Hợp lệ (${age} tuổi).`;
          ageHint.style.color = '#166534';
        }
      });
    }

    const form = el('kycSellerForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const alertBox = el('kycFormAlert');
      const showErr = (msg) => {
        alertBox.className = 'auth-alert auth-alert-error';
        alertBox.textContent = msg;
        alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
      alertBox.className = 'auth-alert hidden';

      const fullName = el('kycFullName').value.trim();
      const dob = el('kycDob').value;
      const cccd = el('kycCccd').value.trim();
      const frontFile = el('kycFrontFile').files && el('kycFrontFile').files[0];
      const backFile = el('kycBackFile').files && el('kycBackFile').files[0];
      const shopName = el('kycShopName').value.trim();
      const phone = el('kycPhone').value.trim();
      const address = el('kycAddress').value.trim();
      const agreed = el('kycAgreeTerms').checked;

      if (fullName.length < 2) return showErr('Vui lòng nhập đầy đủ Họ và tên theo CCCD.');
      const age = calculateAge(dob);
      if (age < 0) return showErr('Vui lòng chọn Ngày tháng năm sinh hợp lệ.');
      if (age < 18) return showErr('Người đăng ký bán hàng bắt buộc đủ 18 tuổi trở lên.');
      if (!/^[0-9]{12}$/.test(cccd)) return showErr('Số CCCD phải gồm đúng 12 chữ số.');
      if (!frontFile || !backFile) return showErr('Vui lòng tải lên đầy đủ ảnh CCCD mặt trước và mặt sau.');
      if (shopName.length < 2) return showErr('Vui lòng nhập Tên gian hàng / Thương hiệu.');
      if (!/^0[0-9]{9}$/.test(phone)) return showErr('Số điện thoại liên hệ phải gồm đúng 10 chữ số (bắt đầu bằng 0).');
      if (address.length < 6) return showErr('Vui lòng nhập Địa chỉ kinh doanh / gửi hàng cụ thể.');
      if (!agreed) return showErr('Vui lòng tích chọn cam đoan thông tin chính chủ.');

      const btn = el('kycSubmitBtn');
      btn.disabled = true;
      btn.innerHTML = '<span class="auth-spinner"></span> Đang tải giấy tờ &amp; gửi hồ sơ...';

      try {
        const [frontPath, backPath] = await Promise.all([
          uploadKycImage(frontFile, 'front'),
          uploadKycImage(backFile, 'back')
        ]);

        const payload = {
          user_id: currentUser.id,
          full_name: fullName,
          date_of_birth: dob,
          cccd_number: cccd,
          cccd_front_path: frontPath,
          cccd_back_path: backPath,
          shop_name: shopName,
          phone,
          business_address: address,
          agreed_terms: true,
          status: 'pending'
        };

        const { error: verErr } = await sb
          .from('seller_verifications')
          .upsert(payload, { onConflict: 'user_id' });
        if (verErr) throw verErr;

        toast('Đã gửi hồ sơ xác minh bán hàng thành công!');
        await loadUserContext(currentUser);
      } catch (err) {
        showErr(translateError(err));
        btn.disabled = false;
        btn.textContent = 'Gửi hồ sơ xác minh bán hàng';
      }
    });
  }

  function render() {
    const mount = el('sellerRegisterMount');
    if (!mount) return;
    if (!currentUser) {
      renderAuthBox(mount);
      return;
    }

    const profStatus = (currentProfile && currentProfile.seller_verification_status) || 'none';
    const verStatus = (currentVerification && currentVerification.status) || profStatus;

    if (profStatus === 'verified' || verStatus === 'verified') {
      renderStatusCard(mount, 'verified');
    } else if (profStatus === 'pending' || verStatus === 'pending') {
      renderStatusCard(mount, 'pending');
    } else {
      renderVerificationForm(mount, profStatus === 'rejected' || verStatus === 'rejected');
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const headerBtn = el('sellerHeaderBtn');
    const headerMenu = el('sellerHeaderMenu');
    const signOutBtn = el('sellerSignOutBtn');

    if (headerBtn && headerMenu) {
      headerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        headerMenu.classList.toggle('hidden');
      });
      document.addEventListener('click', (e) => {
        if (!e.target.closest('#sellerHeaderUser')) headerMenu.classList.add('hidden');
      });
    }

    if (signOutBtn) {
      signOutBtn.addEventListener('click', async () => {
        await sb.auth.signOut();
        await loadUserContext(null);
      });
    }

    try {
      const { data } = await sb.auth.getSession();
      await loadUserContext(data && data.session ? data.session.user : null);
    } catch {
      await loadUserContext(null);
    }

    sb.auth.onAuthStateChange((_event, session) => {
      loadUserContext(session ? session.user : null);
    });
  });
})();
