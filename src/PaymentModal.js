// 付费下载弹窗组件
class PaymentModal {
    constructor() {
        this.modal = null;
        this.overlay = null;
        this.currentState = 'IDLE';
        this.downloadType = null; // 'word' 或 'pdf'
        this.downloadCallback = null;
        this.countdownTimer = null;
        this.isDownloadTriggered = false;

        // 绑定方法
        this.showModal = this.showModal.bind(this);
        this.hideModal = this.hideModal.bind(this);
        this.handleEscKey = this.handleEscKey.bind(this);
        this.handleOverlayClick = this.handleOverlayClick.bind(this);
    }

    /**
     * 显示付费弹窗
     * @param {string} downloadType - 'word' 或 'pdf'
     * @param {Function} downloadCallback - 下载回调函数
     */
    showPaymentModal(downloadType, downloadCallback) {
        this.downloadType = downloadType;
        this.downloadCallback = downloadCallback;
        this.isDownloadTriggered = false;
        this.showModal();
        this.setState('PAY_MODAL');
    }

    showModal() {
        if (this.modal) {
            this.hideModal();
        }

        this.createModalElements();
        this.attachEventListeners();
        document.body.appendChild(this.overlay);
        
        // 优雅的进入动画
        requestAnimationFrame(() => {
            this.overlay.style.opacity = '1';
            this.modal.style.transform = 'scale(1) translateY(0)';
        });
    }

    hideModal() {
        if (!this.overlay) return;

        // 清理倒计时
        if (this.countdownTimer) {
            clearTimeout(this.countdownTimer);
            this.countdownTimer = null;
        }

        // 优雅的退出动画
        this.overlay.style.opacity = '0';
        this.modal.style.transform = 'scale(0.9) translateY(20px)';
        
        setTimeout(() => {
            if (this.overlay && this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
            }
            this.cleanup();
        }, 150);
    }

    createModalElements() {
        // 创建遮罩
        this.overlay = document.createElement('div');
        this.overlay.className = 'puretext-payment-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 10000;
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            box-sizing: border-box;
        `;

        // 创建弹窗
        this.modal = document.createElement('div');
        this.modal.className = 'puretext-payment-modal';
        this.modal.style.cssText = `
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border-radius: 24px;
            box-shadow: 
                0 25px 50px -12px rgba(0, 0, 0, 0.25),
                0 0 0 1px rgba(255, 255, 255, 0.8),
                inset 0 1px 0 rgba(255, 255, 255, 0.9);
            max-height: 85vh;
            overflow: hidden;
            transform: scale(0.9) translateY(20px);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            position: relative;
            width: 440px;
            max-width: 90vw;
            border: 1px solid rgba(226, 232, 240, 0.8);
        `;

        this.overlay.appendChild(this.modal);
        this.modal.addEventListener('click', (e) => e.stopPropagation());
    }

    setState(newState) {
        this.currentState = newState;
        this.renderCurrentState();
    }

    renderCurrentState() {
        if (!this.modal) return;

        switch (this.currentState) {
            case 'PAY_MODAL':
                this.renderPaymentPage();
                break;
            case 'CONTACT':
                this.renderContactPage();
                break;
            case 'THANKS':
                this.renderThanksPage();
                break;
        }
    }

    renderPaymentPage() {
        this.modal.innerHTML = `
            <div class="modal-header">
                <button class="contact-btn" type="button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 12h8m-4-4v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    联系客服
                </button>
                <button class="close-btn" type="button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
            
            <div class="modal-content">
                <div class="hero-section">
                    <div class="logo-container">
                        <div class="logo-animation">
                            <svg width="48" height="48" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="64" height="64" rx="16" fill="url(#logoGradient)"/>
                                <path d="M20 24h24M20 32h16M20 40h20" stroke="white" stroke-width="3" stroke-linecap="round"/>
                                <defs>
                                    <linearGradient id="logoGradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stop-color="#6366f1"/>
                                        <stop offset="100%" stop-color="#8b5cf6"/>
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                    </div>
                    <h1 class="main-title">解锁下载，0.2元/次</h1>
                    <p class="subtitle">轻松一下，立刻保存你的高质量文件～</p>
                </div>

                <div class="payment-section">
                    <div class="payment-methods">
                        <div class="payment-method">
                            <div class="payment-method-header">
                                <div class="payment-icon wechat">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path d="M8.5 6c-3.31 0-6 2.42-6 5.39 0 1.74.84 3.29 2.17 4.34L4 17.5l2.06-.54c.67.15 1.38.23 2.11.23.35 0 .69-.02 1.02-.07-.1-.33-.15-.67-.15-1.02 0-2.76 2.46-5 5.5-5 .34 0 .68.03 1 .09C15.03 8.51 12.1 6 8.5 6z" fill="#07C160"/>
                                        <path d="M19 12.5c0-2.48-2.24-4.5-5-4.5s-5 2.02-5 4.5 2.24 4.5 5 4.5c.58 0 1.14-.08 1.65-.23L17.5 18l-.92-1.84C17.66 15.29 19 14.02 19 12.5z" fill="#07C160"/>
                                    </svg>
                                </div>
                                <span class="payment-label">微信支付</span>
                            </div>
                            <div class="qr-container">
                                <img src="${chrome.runtime.getURL('assets/wechat_qr.png')}" alt="微信收款码" class="qr-image">
                            </div>
                        </div>
                        
                        <div class="payment-method">
                            <div class="payment-method-header">
                                <div class="payment-icon alipay">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" fill="#1677FF"/>
                                        <path d="M8 14.5c2.5-1 5.5-1 8 0-2.5-2-5.5-2-8 0z" fill="white"/>
                                        <circle cx="10" cy="10" r="1.5" fill="white"/>
                                        <circle cx="14" cy="10" r="1.5" fill="white"/>
                                    </svg>
                                </div>
                                <span class="payment-label">支付宝</span>
                            </div>
                            <div class="qr-container">
                                <img src="${chrome.runtime.getURL('assets/alipay_qr.png')}" alt="支付宝收款码" class="qr-image">
                            </div>
                        </div>
                    </div>
                    <p class="qr-tip">请使用对应 App 扫码支付</p>
                </div>

                <div class="action-section">
                    <button class="payment-btn" type="button">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        已付款
                    </button>
                    <p class="trust-badge">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1 1v6c0 .552.448 1 1 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        无需登录 · 无广告 · 无后台留存订单
                    </p>
                </div>
            </div>
        `;

        this.applyPaymentPageStyles();
        this.attachPaymentPageEvents();
    }

    renderContactPage() {
        this.modal.innerHTML = `
            <div class="modal-header">
                <button class="back-btn" type="button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 12H5m7-7l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    返回
                </button>
                <h3 class="contact-title">联系我</h3>
                <button class="close-btn" type="button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
            
            <div class="modal-content">

                <div class="contact-methods">
                    <div class="contact-method xhs-method">
                        <div class="contact-method-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                <rect x="2" y="2" width="20" height="20" rx="4" fill="#ff2442"/>
                                <path d="M8 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <circle cx="12" cy="8" r="2" fill="white"/>
                            </svg>
                        </div>
                        <div class="contact-method-content">
                            <div class="qr-container">
                                <img src="${chrome.runtime.getURL('assets/xhs_qr.png')}" alt="小红书二维码" class="qr-image">
                            </div>
                            <p class="qr-instruction">用小红书扫码关注</p>
                        </div>
                    </div>

                    <div class="contact-method email-method">
                        <div class="contact-method-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                <rect x="2" y="4" width="20" height="16" rx="2" fill="#3b82f6"/>
                                <path d="M2 6l10 7 10-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="contact-method-content">
                            <div class="email-container">
                                <span class="email-address">support@example.com</span>
                                <button class="copy-email-btn" type="button">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2" fill="none"/>
                                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="2" fill="none"/>
                                    </svg>
                                    复制
                                </button>
                            </div>
                            <p class="contact-tip">有问题随时找我～</p>
                        </div>
                    </div>
                </div>

            </div>
        `;

        this.applyContactPageStyles();
        this.attachContactPageEvents();
    }

    renderThanksPage() {
        this.modal.innerHTML = `
            <div class="modal-header">
                <div class="header-spacer"></div>
                <button class="close-btn" type="button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
            
            <div class="modal-content">
                <div class="thanks-hero">
                    <div class="success-animation">
                        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="40" cy="40" r="38" fill="url(#successGradient)" stroke="url(#successStroke)" stroke-width="4"/>
                            <path d="M25 40l10 10 20-20" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class="checkmark"/>
                            <defs>
                                <linearGradient id="successGradient" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stop-color="#10b981"/>
                                    <stop offset="100%" stop-color="#059669"/>
                                </linearGradient>
                                <linearGradient id="successStroke" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stop-color="#34d399"/>
                                    <stop offset="100%" stop-color="#10b981"/>
                                </linearGradient>
                            </defs>
                        </svg>
                        <div class="success-sparkles">
                            <div class="sparkle sparkle-1">✨</div>
                            <div class="sparkle sparkle-2">🎉</div>
                            <div class="sparkle sparkle-3">⭐</div>
                            <div class="sparkle sparkle-4">💫</div>
                        </div>
                    </div>
                    
                    <h1 class="thanks-title">谢谢支持！</h1>
                    
                    <div class="download-status">
                        <div class="download-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <span class="download-text">正在准备下载（<span class="countdown">3</span>s）…</span>
                    </div>
                    
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                </div>
            </div>
        `;

        this.applyThanksPageStyles();
        this.attachThanksPageEvents();
        this.startDownloadAndCountdown();
    }

    applyPaymentPageStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 24px 0;
                position: relative;
            }
            
            .contact-btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 10px 16px;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }
            
            .contact-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
            }
            
            .contact-btn svg {
                width: 16px;
                height: 16px;
            }
            
            .close-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                background: rgba(148, 163, 184, 0.1);
                border: none;
                border-radius: 12px;
                color: #64748b;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .close-btn:hover {
                background: rgba(239, 68, 68, 0.1);
                color: #ef4444;
                transform: scale(1.05);
            }
            
            .modal-content {
                padding: 24px;
                padding-top: 16px;
            }
            
            .hero-section {
                text-align: center;
                margin-bottom: 32px;
            }
            
            .logo-container {
                margin-bottom: 20px;
            }
            
            .logo-animation {
                display: inline-block;
                animation: float 6s ease-in-out infinite;
            }
            
            @keyframes float {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-10px) rotate(2deg); }
            }
            
            .main-title {
                font-size: 24px;
                font-weight: 700;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin: 0 0 12px 0;
                line-height: 1.3;
                letter-spacing: -0.02em;
            }
            
            .price-badge {
                display: inline-flex;
                align-items: baseline;
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 8px 20px;
                border-radius: 20px;
                margin-bottom: 12px;
                box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
            }
            
            .price-symbol {
                font-size: 16px;
                font-weight: 600;
            }
            
            .price-amount {
                font-size: 24px;
                font-weight: 700;
                margin: 0 2px;
            }
            
            .price-unit {
                font-size: 14px;
                opacity: 0.9;
            }
            
            .subtitle {
                font-size: 16px;
                font-weight: 400;
                color: #64748b;
                margin: 0 0 32px 0;
                line-height: 1.5;
                letter-spacing: -0.01em;
            }
            
            .payment-section {
                margin-bottom: 32px;
            }
            
            .payment-methods {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }
            
            .payment-method {
                background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
                border: 2px solid #e2e8f0;
                border-radius: 16px;
                padding: 20px;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }
            
            .payment-method::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.5), transparent);
                transform: translateX(-100%);
                transition: transform 0.6s ease;
            }
            
            .payment-method:hover {
                border-color: #6366f1;
                transform: translateY(-4px);
                box-shadow: 0 12px 24px rgba(99, 102, 241, 0.15);
            }
            
            .payment-method:hover::before {
                transform: translateX(100%);
            }
            
            .payment-method-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 16px;
            }
            
            .payment-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                border-radius: 8px;
            }
            
            .payment-icon.wechat {
                background: linear-gradient(135deg, #07c160 0%, #05a84d 100%);
            }
            
            .payment-icon.alipay {
                background: linear-gradient(135deg, #1677ff 0%, #0d5bdd 100%);
            }
            
            .payment-label {
                font-size: 14px;
                font-weight: 600;
                color: #334155;
                letter-spacing: -0.005em;
            }
            
            .qr-container {
                display: flex;
                justify-content: center;
                align-items: center;
                background: white;
                border-radius: 12px;
                padding: 12px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            }
            
            .qr-image {
                width: 120px;
                height: 120px;
                object-fit: contain;
                border-radius: 8px;
            }
            
            .action-section {
                text-align: center;
            }
            
            .payment-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                width: 100%;
                padding: 16px 24px;
                background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                color: white;
                border: none;
                border-radius: 16px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
                margin-bottom: 16px;
                position: relative;
                overflow: hidden;
                letter-spacing: -0.01em;
            }
            
            .payment-btn::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                transition: left 0.5s ease;
            }
            
            .payment-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 12px 28px rgba(139, 92, 246, 0.4);
            }
            
            .payment-btn:hover::before {
                left: 100%;
            }
            
            .payment-btn:active {
                transform: translateY(0);
            }
            
            .trust-badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                font-size: 13px;
                font-weight: 400;
                color: #64748b;
                margin: 0;
                background: rgba(148, 163, 184, 0.1);
                padding: 8px 16px;
                border-radius: 20px;
                letter-spacing: -0.005em;
            }
            
            .trust-badge svg {
                color: #10b981;
            }
            
            .qr-tip {
                text-align: center;
                margin-top: 16px;
                font-size: 14px;
                font-weight: 400;
                color: #64748b;
                margin-bottom: 0;
                letter-spacing: -0.005em;
            }
            
            /* 移动端适配 */
            @media (max-width: 768px) {
                .modal-content {
                    padding: 20px;
                }
                
                .payment-methods {
                    grid-template-columns: 1fr;
                    gap: 16px;
                }
                
                .qr-image {
                    width: 100px;
                    height: 100px;
                }
                
                .main-title {
                    font-size: 22px;
                }
                
                .contact-btn {
                    padding: 8px 12px;
                    font-size: 13px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    applyContactPageStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .back-btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: rgba(148, 163, 184, 0.1);
                color: #64748b;
                border: none;
                padding: 10px 16px;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .back-btn:hover {
                background: rgba(99, 102, 241, 0.1);
                color: #6366f1;
                transform: translateX(-2px);
            }
            
            .contact-title {
                flex: 1;
                text-align: center;
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: #1e293b;
                letter-spacing: -0.01em;
            }
            
            .contact-methods {
                display: flex;
                flex-direction: column;
                gap: 24px;
                margin-bottom: 32px;
            }
            
            .contact-method {
                background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
                border: 2px solid #e2e8f0;
                border-radius: 20px;
                padding: 24px;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }
            
            .contact-method::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, transparent, rgba(244, 114, 182, 0.6), transparent);
                transform: translateX(-100%);
                transition: transform 0.6s ease;
            }
            
            .contact-method:hover {
                border-color: #f472b6;
                transform: translateY(-6px);
                box-shadow: 0 16px 32px rgba(244, 114, 182, 0.2);
            }
            
            .contact-method:hover::before {
                transform: translateX(100%);
            }
            
            .contact-method-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 56px;
                height: 56px;
                background: linear-gradient(135deg, #f472b6 0%, #be185d 100%);
                border-radius: 16px;
                margin-bottom: 16px;
                box-shadow: 0 8px 20px rgba(244, 114, 182, 0.3);
            }
            
            .qr-container {
                display: flex;
                justify-content: center;
                align-items: center;
                background: white;
                border-radius: 16px;
                padding: 16px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                margin-bottom: 12px;
                border: 1px solid #f1f5f9;
            }
            
            .qr-image {
                width: 140px;
                height: 140px;
                object-fit: contain;
                border-radius: 12px;
            }
            
            .qr-instruction {
                font-size: 14px;
                font-weight: 400;
                color: #64748b;
                margin: 0;
                text-align: center;
                letter-spacing: -0.005em;
            }
            
            .email-container {
                display: flex;
                align-items: center;
                gap: 12px;
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 16px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            }
            
            .email-address {
                flex: 1;
                font-size: 15px;
                font-weight: 500;
                color: #1e293b;
                font-family: 'Monaco', 'Menlo', 'SF Mono', 'Consolas', monospace;
                letter-spacing: -0.01em;
            }
            
            .copy-email-btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
            }
            
            .copy-email-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
            }
            
            .copy-email-btn:active {
                transform: translateY(0);
            }
            
            .contact-tip {
                font-size: 14px;
                font-weight: 400;
                color: #64748b;
                margin: 12px 0 0 0;
                text-align: center;
                letter-spacing: -0.005em;
            }
            
            /* 移动端适配 */
            @media (max-width: 768px) {
                .contact-method {
                    padding: 20px;
                }
                
                .contact-method-icon {
                    width: 48px;
                    height: 48px;
                }
                
                .qr-image {
                    width: 120px;
                    height: 120px;
                }
                
                .email-container {
                    flex-direction: column;
                    text-align: center;
                }
                
                .email-address {
                    font-size: 14px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    applyThanksPageStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .header-spacer {
                flex: 1;
            }
            
            .thanks-hero {
                text-align: center;
                padding: 40px 0;
            }
            
            .success-animation {
                position: relative;
                display: inline-block;
                margin-bottom: 32px;
                animation: successPulse 2s ease-in-out infinite;
            }
            
            @keyframes successPulse {
                0%, 100% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(1.05);
                }
            }
            
            .checkmark {
                stroke-dasharray: 50;
                stroke-dashoffset: 50;
                animation: drawCheck 1s ease-out 0.5s forwards;
            }
            
            @keyframes drawCheck {
                to {
                    stroke-dashoffset: 0;
                }
            }
            
            .success-sparkles {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
            }
            
            .sparkle {
                position: absolute;
                font-size: 20px;
                animation: sparkleFloat 3s ease-in-out infinite;
                opacity: 0.8;
            }
            
            .sparkle-1 {
                top: -60px;
                left: -20px;
                animation-delay: 0s;
            }
            
            .sparkle-2 {
                top: -40px;
                right: -30px;
                animation-delay: 0.5s;
            }
            
            .sparkle-3 {
                bottom: -50px;
                left: -25px;
                animation-delay: 1s;
            }
            
            .sparkle-4 {
                bottom: -45px;
                right: -20px;
                animation-delay: 1.5s;
            }
            
            @keyframes sparkleFloat {
                0%, 100% {
                    transform: translateY(0px) rotate(0deg);
                    opacity: 0.8;
                }
                50% {
                    transform: translateY(-15px) rotate(180deg);
                    opacity: 1;
                }
            }
            
            .thanks-title {
                font-size: 28px;
                font-weight: 700;
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin: 0 0 32px 0;
                line-height: 1.3;
                letter-spacing: -0.02em;
            }
            
            .thanks-subtitle {
                font-size: 16px;
                color: #64748b;
                margin: 0 0 32px 0;
                line-height: 1.5;
            }
            
            .download-status {
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                border: 2px solid #0ea5e9;
                border-radius: 20px;
                padding: 24px;
                margin-bottom: 24px;
                position: relative;
                overflow: hidden;
            }
            
            .download-status::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(14, 165, 233, 0.1), transparent);
                animation: shimmer 2s ease-in-out infinite;
            }
            
            @keyframes shimmer {
                0% {
                    left: -100%;
                }
                100% {
                    left: 100%;
                }
            }
            
            .download-icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 48px;
                height: 48px;
                background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
                border-radius: 16px;
                margin-bottom: 16px;
                color: white;
                animation: downloadBounce 2s ease-in-out infinite;
                box-shadow: 0 8px 20px rgba(14, 165, 233, 0.3);
            }
            
            @keyframes downloadBounce {
                0%, 100% {
                    transform: translateY(0px);
                }
                50% {
                    transform: translateY(-8px);
                }
            }
            
            .download-text {
                display: block;
                font-size: 16px;
                font-weight: 500;
                color: #0f172a;
                margin-bottom: 12px;
                letter-spacing: -0.01em;
            }
            
            .countdown-container {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                font-size: 14px;
                color: #64748b;
            }
            
            .countdown {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                color: white;
                border-radius: 8px;
                font-weight: 700;
                font-size: 16px;
                margin: 0 4px;
                animation: countdownPulse 1s ease-in-out infinite;
                box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
            }
            
            @keyframes countdownPulse {
                0%, 100% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(1.1);
                }
            }
            
            .progress-bar {
                width: 100%;
                height: 6px;
                background: rgba(148, 163, 184, 0.2);
                border-radius: 3px;
                overflow: hidden;
                position: relative;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #10b981, #059669, #10b981);
                background-size: 200% 100%;
                border-radius: 3px;
                animation: progressFill 3s linear forwards, progressShimmer 1.5s ease-in-out infinite;
                width: 0%;
            }
            
            @keyframes progressFill {
                0% {
                    width: 0%;
                }
                100% {
                    width: 100%;
                }
            }
            
            @keyframes progressShimmer {
                0% {
                    background-position: -200% 0;
                }
                100% {
                    background-position: 200% 0;
                }
            }
            
            /* 移动端适配 */
            @media (max-width: 768px) {
                .thanks-hero {
                    padding: 32px 0;
                }
                
                .thanks-title {
                    font-size: 28px;
                }
                
                .success-animation {
                    margin-bottom: 24px;
                }
                
                .success-animation svg {
                    width: 64px;
                    height: 64px;
                }
                
                .sparkle {
                    font-size: 16px;
                }
                
                .download-status {
                    padding: 20px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    attachPaymentPageEvents() {
        const contactBtn = this.modal.querySelector('.contact-btn');
        const closeBtn = this.modal.querySelector('.close-btn');
        const paymentBtn = this.modal.querySelector('.payment-btn');

        contactBtn.addEventListener('click', () => {
            this.setState('CONTACT');
        });

        closeBtn.addEventListener('click', () => {
            this.hideModal();
        });

        paymentBtn.addEventListener('click', () => {
            this.setState('THANKS');
        });
    }

    attachContactPageEvents() {
        const backBtn = this.modal.querySelector('.back-btn');
        const closeBtn = this.modal.querySelector('.close-btn');
        const xhsLinkBtn = this.modal.querySelector('.xhs-link-btn');
        const copyEmailBtn = this.modal.querySelector('.copy-email-btn');

        backBtn.addEventListener('click', () => {
            this.setState('PAY_MODAL');
        });

        closeBtn.addEventListener('click', () => {
            this.hideModal();
        });

        xhsLinkBtn.addEventListener('click', () => {
            window.open('https://www.xiaohongshu.com', '_blank');
        });

        copyEmailBtn.addEventListener('click', () => {
            navigator.clipboard.writeText('support@example.com').then(() => {
                copyEmailBtn.textContent = '已复制';
                setTimeout(() => {
                    copyEmailBtn.textContent = '复制';
                }, 2000);
            });
        });
    }

    attachThanksPageEvents() {
        const closeBtn = this.modal.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            this.hideModal();
        });
    }

    startDownloadAndCountdown() {
        // 立即触发下载
        this.triggerDownload();
        
        // 开始3秒倒计时
        let countdown = 3;
        const countdownElement = this.modal.querySelector('.countdown');
        
        const updateCountdown = () => {
            countdown--;
            if (countdownElement) {
                countdownElement.textContent = countdown;
            }
            
            if (countdown > 0) {
                this.countdownTimer = setTimeout(updateCountdown, 1000);
            } else {
                // 倒计时结束，自动关闭弹窗
                this.hideModal();
            }
        };
        
        this.countdownTimer = setTimeout(updateCountdown, 1000);
    }

    async triggerDownload() {
        if (this.isDownloadTriggered || !this.downloadCallback) return;
        
        this.isDownloadTriggered = true;
        
        try {
            await this.downloadCallback();
        } catch (error) {
            console.error('Download failed:', error);
            this.handleDownloadFailure();
        }
    }

    handleDownloadFailure() {
        // 清理倒计时
        if (this.countdownTimer) {
            clearTimeout(this.countdownTimer);
            this.countdownTimer = null;
        }

        // 显示下载失败界面
        this.modal.innerHTML = `
            <div class="thanks-header">
                <button class="close-btn" type="button">×</button>
            </div>
            <div class="thanks-content">
                <div class="thanks-logo" style="color: #f44336;">⚠️</div>
                <h2 class="thanks-title">下载失败，请重试</h2>
                <div class="error-actions">
                    <button class="retry-btn" type="button">重新下载</button>
                    <button class="contact-support-btn" type="button">联系客服</button>
                </div>
            </div>
        `;

        // 添加错误页面样式
        const style = document.createElement('style');
        style.textContent = `
            .error-actions {
                display: flex;
                gap: 12px;
                justify-content: center;
                margin-top: 20px;
            }
            .retry-btn, .contact-support-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.15s ease;
            }
            .retry-btn {
                background: #1976d2;
                color: white;
            }
            .retry-btn:hover {
                background: #1565c0;
            }
            .contact-support-btn {
                background: #f5f5f5;
                color: #333;
                border: 1px solid #ddd;
            }
            .contact-support-btn:hover {
                background: #e5e5e5;
            }
        `;
        document.head.appendChild(style);

        // 绑定错误页面事件
        const closeBtn = this.modal.querySelector('.close-btn');
        const retryBtn = this.modal.querySelector('.retry-btn');
        const contactSupportBtn = this.modal.querySelector('.contact-support-btn');

        closeBtn.addEventListener('click', () => {
            this.hideModal();
        });

        retryBtn.addEventListener('click', () => {
            this.isDownloadTriggered = false;
            this.setState('THANKS');
        });

        contactSupportBtn.addEventListener('click', () => {
            this.setState('CONTACT');
        });
    }

    attachEventListeners() {
        document.addEventListener('keydown', this.handleEscKey);
        this.overlay.addEventListener('click', this.handleOverlayClick);
    }

    handleEscKey(event) {
        if (event.key === 'Escape') {
            this.hideModal();
        }
    }

    handleOverlayClick(event) {
        if (event.target === this.overlay) {
            this.hideModal();
        }
    }

    cleanup() {
        document.removeEventListener('keydown', this.handleEscKey);
        if (this.countdownTimer) {
            clearTimeout(this.countdownTimer);
            this.countdownTimer = null;
        }
        this.modal = null;
        this.overlay = null;
        this.currentState = 'IDLE';
        this.downloadType = null;
        this.downloadCallback = null;
        this.isDownloadTriggered = false;
    }
}

// 创建全局单例
window.PaymentModal = window.PaymentModal || new PaymentModal();

export { PaymentModal };