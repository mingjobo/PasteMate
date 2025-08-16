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
        
        // 像素风格进入动画
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

        // 像素风格退出动画
        this.overlay.style.opacity = '0';
        this.modal.style.transform = 'scale(0.95) translateY(10px)';
        
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
            background: rgba(0, 0, 0, 0.3);
            z-index: 10000;
            opacity: 0;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            box-sizing: border-box;
        `;

        // 创建弹窗
        this.modal = document.createElement('div');
        this.modal.className = 'puretext-payment-modal card-modal';
        this.modal.style.cssText = `
            background: #FFFFFF;
            border: 1px solid #E5E7EB;
            border-radius: 24px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            max-height: 85vh;
            overflow: hidden;
            transform: scale(0.95) translateY(10px);
            transition: all 0.3s ease;
            position: relative;
            width: 420px;
            max-width: 90vw;
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
                    <h1 class="main-title pixel-font">支持锅巴!</h1>
                    <div class="price-badge pixel-badge">
                        <span class="pixel-font">¥0.2/次</span>
                    </div>
                    
                </div>

                <div class="payment-section">
                    <div class="payment-methods">
                        <div class="payment-method">
                            <div class="payment-method-header">
                                
                            </div>
                            <div class="qr-container">
                                <img src="${chrome.runtime.getURL('assets/wechat_qr.png')}" alt="微信收款码" class="qr-image">
                            </div>
                        </div>
                        
                        <div class="payment-method">
                            <div class="payment-method-header">
                               
                            </div>
                            <div class="qr-container">
                                <img src="${chrome.runtime.getURL('assets/alipay_qr.png')}" alt="支付宝收款码" class="qr-image">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="action-section">
                    <button class="payment-btn pixel-btn" type="button">
                        <span class="pixel-font">确认打赏</span>
                    </button>
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
                <h3 class="contact-title pixel-font">联系客服</h3>
                <button class="close-btn" type="button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
            
            <div class="modal-content">
                <div class="contact-methods">
                    <div class="contact-method xhs-method pixel-card-clean">
                        <div class="contact-method-header">
                            <div class="contact-method-icon pixel-icon-unified">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <rect x="2" y="2" width="20" height="20" rx="3" fill="white"/>
                                    <path d="M8 12l2 2 4-4" stroke="#9B8CFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <circle cx="12" cy="8" r="2" fill="#9B8CFF"/>
                                </svg>
                            </div>
                            <h4 class="contact-method-title">小红书关注</h4>
                        </div>
                        <div class="qr-container pixel-qr-clean">
                            <img src="${chrome.runtime.getURL('assets/xhs_qr.png')}" alt="小红书二维码" class="qr-image-clean">
                        </div>
                        <p class="qr-instruction pixel-text">扫码关注</p>
                    </div>

                    <div class="contact-method email-method pixel-card-clean">
                        <div class="contact-method-header">
                            <div class="contact-method-icon pixel-icon-unified">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <rect x="2" y="4" width="20" height="16" rx="2" fill="white"/>
                                    <path d="M2 6l10 7 10-7" stroke="#9B8CFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <h4 class="contact-method-title">邮箱联系</h4>
                        </div>
                        <div class="email-row">
                            <span class="email-address-clean">support@evedo.run</span>
                            <button class="copy-email-btn pixel-btn-primary" type="button">
                                <span>复制</span>
                            </button>
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
                    
                    <h1 class="thanks-title pixel-font">谢谢支持!</h1>
                    <div class="pixel-status-badge success-badge">
                        <span class="pixel-font">下载已启动</span>
                    </div>
                    
                    <div class="download-status">
                        <div class="download-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <span class="download-text pixel-font">正在准备下载...</span>
                        <div class="countdown-container">
                            <span class="countdown-text">弹窗将在</span>
                            <span class="countdown pixel-counter">3</span>
                            <span class="countdown-text">秒后自动关闭</span>
                        </div>
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
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&display=swap');
            
            .pixel-font {
                font-family: 'Inter', 'PingFang SC', sans-serif;
                font-weight: 200;
                font-size: 14px;
                line-height: 1.4;
            }
            
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
                background: #000000;
                color: white;
                border: none;
                padding: 10px 16px;
                border-radius: 16px;
                font-size: 14px;
                font-weight: 300;
                cursor: pointer;
                transition: all 0.2s ease;
                font-family: 'Inter', 'PingFang SC', sans-serif;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .contact-btn:hover {
                background: #333333;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            
            .contact-btn:active {
                transform: translateY(0);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
                background: #F8F9FA;
                border: none;
                border-radius: 18px;
                color: #64748b;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            }
            
            .close-btn:hover {
                background: #FFE5E5;
                color: #FF4D4F;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            
            .close-btn:active {
                transform: translateY(0);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            }
            
            .modal-content {
                padding: 24px;
                padding-top: 20px;
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
                animation: logoFloat 2s ease-in-out infinite;
            }
            
            @keyframes logoFloat {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-3px); }
            }
            
            .main-title {
                font-size: 24px;
                font-weight: 200;
                color: #1a1a1a;
                margin: 0 0 16px 0;
                line-height: 1.3;
                font-family: 'Inter', 'PingFang SC', sans-serif;
            }
            
            .pixel-badge {
                display: inline-block;
                background: #34C759;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                margin-bottom: 20px;
                font-size: 14px;
                font-weight: 300;
                font-family: 'Inter', 'PingFang SC', sans-serif;
                box-shadow: 0 2px 8px rgba(52, 199, 89, 0.2);
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
                background: #FFFFFF;
                border: 1px solid #E5E7EB;
                border-radius: 20px;
                padding: 20px;
                transition: all 0.2s ease;
                position: relative;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
            }
            
            .payment-method:hover {
                border-color: #D1D5DB;
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
            }
            
            .qr-container {
                display: flex;
                justify-content: center;
                align-items: center;
                background: #FAFAFA;
                border-radius: 16px;
                padding: 16px;
            }
            
            .qr-image {
                width: 100px;
                height: 100px;
                object-fit: contain;
                border-radius: 8px;
            }
            
            .action-section {
                text-align: center;
            }
            
            .pixel-btn {
                display: inline-block;
                width: 100%;
                padding: 16px 24px;
                background: #000000;
                color: white;
                border: none;
                border-radius: 20px;
                font-size: 16px;
                font-weight: 300;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
                font-family: 'Inter', 'PingFang SC', sans-serif;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            
            .pixel-btn:hover {
                background: #333333;
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            }
            
            .pixel-btn:active {
                transform: translateY(0);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
                    width: 80px;
                    height: 80px;
                }
                
                .main-title {
                    font-size: 20px;
                }
                
                .contact-btn {
                    padding: 8px 12px;
                    font-size: 12px;
                }
                
                .pixel-font {
                    font-size: 12px;
                }
                
                .pixel-btn {
                    padding: 14px 20px;
                    font-size: 14px;
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
                background: #F8F9FA;
                color: #64748b;
                border: none;
                padding: 10px 16px;
                border-radius: 16px;
                font-size: 14px;
                font-weight: 300;
                cursor: pointer;
                transition: all 0.2s ease;
                font-family: 'Inter', 'PingFang SC', sans-serif;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            }
            
            .back-btn:hover {
                background: #E5E7EB;
                color: #374151;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            
            .back-btn:active {
                transform: translateY(0);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            }
            
            .contact-title {
                flex: 1;
                text-align: center;
                margin: 0;
                font-size: 16px;
                font-weight: 300;
                color: #1a1a1a;
                font-family: 'Inter', 'PingFang SC', sans-serif;
            }
            
            .contact-hero {
                text-align: center;
                margin-bottom: 32px;
            }
            
            .contact-avatar {
                margin-bottom: 20px;
            }
            
            .contact-methods {
                display: flex;
                flex-direction: column;
                gap: 24px;
                margin-bottom: 32px;
            }
            
            /* 新的统一风格卡片 */
            .pixel-card-clean {
                background: #FFFFFF;
                border: 1px solid #E5E7EB;
                border-radius: 20px;
                padding: 24px;
                transition: all 0.2s ease;
                position: relative;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
            }
            
            .pixel-card-clean:hover {
                transform: translateY(-2px);
                border-color: #D1D5DB;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
            }
            
            /* 卡片头部：icon + 标题横向排列 */
            .contact-method-header {
                display: flex;
                align-items: center;
                gap: 16px;
                margin-bottom: 20px;
            }
            
            /* 统一的icon样式 */
            .pixel-icon-unified {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                background: #000000;
                border-radius: 20px;
                flex-shrink: 0;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .contact-method-title {
                font-size: 18px;
                font-weight: 300;
                color: #1a1a1a;
                margin: 0;
                font-family: 'Inter', 'PingFang SC', sans-serif;
            }
            
            /* 小红书卡片 - 简化布局 */
            .pixel-qr-clean {
                display: flex;
                justify-content: center;
                align-items: center;
                background: #FAFAFA;
                border-radius: 16px;
                padding: 20px;
                margin-bottom: 16px;
            }
            
            .qr-image-clean {
                width: 120px;
                height: 120px;
                object-fit: contain;
                border-radius: 8px;
            }
            
            .pixel-text {
                text-align: center;
                font-size: 14px;
                font-weight: 300;
                color: #64748b;
                margin: 0;
                font-family: 'Inter', 'PingFang SC', sans-serif;
            }
            
            /* 邮箱卡片 - 横向布局 */
            .email-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 20px;
                background: #FAFAFA;
                border-radius: 16px;
                padding: 20px;
            }
            
            .email-address-clean {
                flex: 1;
                font-size: 16px;
                font-weight: 300;
                color: #1a1a1a;
                font-family: 'Inter', 'Monaco', monospace;
            }
            
            /* 主要复制按钮 */
            .pixel-btn-primary {
                display: inline-flex;
                align-items: center;
                background: #000000;
                color: white;
                border: none;
                border-radius: 16px;
                padding: 12px 20px;
                font-size: 14px;
                font-weight: 300;
                cursor: pointer;
                transition: all 0.2s ease;
                font-family: 'Inter', 'PingFang SC', sans-serif;
                flex-shrink: 0;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .pixel-btn-primary:hover {
                background: #333333;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            
            .pixel-btn-primary:active {
                transform: translateY(0);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            /* 移动端适配 */
            @media (max-width: 768px) {
                .pixel-card-clean {
                    padding: 20px;
                }
                
                .contact-method-header {
                    gap: 12px;
                    margin-bottom: 16px;
                }
                
                .pixel-icon-unified {
                    width: 36px;
                    height: 36px;
                    border-radius: 18px;
                }
                
                .qr-image-clean {
                    width: 100px;
                    height: 100px;
                }
                
                .contact-method-title {
                    font-size: 16px;
                }
                
                .email-row {
                    flex-direction: column;
                    text-align: center;
                    gap: 16px;
                    padding: 16px;
                }
                
                .email-address-clean {
                    font-size: 14px;
                }
                
                .pixel-btn-primary {
                    padding: 10px 16px;
                    font-size: 12px;
                }
                
                .pixel-font {
                    font-size: 12px;
                }
            }
            
            @keyframes pixelSuccessFlash {
                0% { 
                    background: #000000;
                    transform: scale(1); 
                }
                50% { 
                    background: #34C759;
                    transform: scale(1.05);
                    box-shadow: 0 0 16px rgba(52, 199, 89, 0.6);
                }
                100% { 
                    background: #34C759;
                    transform: scale(1); 
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
                padding: 32px 0;
            }
            
            .success-animation {
                position: relative;
                display: inline-block;
                margin-bottom: 24px;
                animation: successPulse 1s ease-in-out infinite;
            }
            
            @keyframes successPulse {
                0%, 100% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(1.02);
                }
            }
            
            .checkmark {
                stroke-dasharray: 50;
                stroke-dashoffset: 50;
                animation: drawCheck 0.8s ease-out 0.2s forwards;
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
                font-size: 16px;
                animation: sparkle 2s ease-in-out infinite;
                opacity: 0.7;
            }
            
            .sparkle-1 {
                top: -40px;
                left: -16px;
                animation-delay: 0s;
            }
            
            .sparkle-2 {
                top: -30px;
                right: -20px;
                animation-delay: 0.3s;
            }
            
            .sparkle-3 {
                bottom: -35px;
                left: -18px;
                animation-delay: 0.6s;
            }
            
            .sparkle-4 {
                bottom: -30px;
                right: -16px;
                animation-delay: 0.9s;
            }
            
            @keyframes sparkle {
                0%, 100% {
                    transform: translateY(0px);
                    opacity: 0.7;
                }
                50% {
                    transform: translateY(-6px);
                    opacity: 1;
                }
            }
            
            .thanks-title {
                font-size: 24px;
                font-weight: 200;
                color: #34C759;
                margin: 0 0 20px 0;
                line-height: 1.3;
                font-family: 'Inter', 'PingFang SC', sans-serif;
            }
            
            .pixel-status-badge.success-badge {
                background: #34C759;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                margin-bottom: 24px;
                font-size: 14px;
                font-weight: 300;
                font-family: 'Inter', 'PingFang SC', sans-serif;
                box-shadow: 0 2px 8px rgba(52, 199, 89, 0.2);
            }
            
            .download-status {
                background: #FFFFFF;
                border: 1px solid #E5E7EB;
                border-radius: 20px;
                padding: 24px;
                margin-bottom: 20px;
                position: relative;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
            }
            
            .download-icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 48px;
                height: 48px;
                background: #000000;
                border-radius: 24px;
                margin-bottom: 16px;
                color: white;
                animation: downloadBounce 1.5s ease-in-out infinite;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            @keyframes downloadBounce {
                0%, 100% {
                    transform: translateY(0px);
                }
                50% {
                    transform: translateY(-3px);
                }
            }
            
            .download-text {
                display: block;
                font-size: 16px;
                font-weight: 300;
                color: #1a1a1a;
                margin-bottom: 16px;
                font-family: 'Inter', 'PingFang SC', sans-serif;
            }
            
            .countdown-container {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                font-size: 14px;
                color: #64748b;
                font-family: 'Inter', 'PingFang SC', sans-serif;
                font-weight: 300;
            }
            
            .pixel-counter {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                background: #34C759;
                color: white;
                border-radius: 14px;
                font-weight: 500;
                font-size: 14px;
                margin: 0 4px;
                animation: countdownPulse 1s ease-in-out infinite;
                font-family: 'Inter', 'PingFang SC', sans-serif;
                box-shadow: 0 2px 8px rgba(52, 199, 89, 0.2);
            }
            
            @keyframes countdownPulse {
                0%, 100% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(1.05);
                }
            }
            
            .progress-bar {
                width: 100%;
                height: 6px;
                background: #F1F5F9;
                border-radius: 3px;
                overflow: hidden;
                position: relative;
            }
            
            .progress-fill {
                height: 100%;
                background: #34C759;
                border-radius: 3px;
                animation: progressFill 3s linear forwards;
                width: 0%;
                position: relative;
            }
            
            .progress-fill::after {
                content: '';
                position: absolute;
                top: 0;
                right: 0;
                width: 3px;
                height: 100%;
                background: #28A745;
                animation: progressGlow 0.5s ease-in-out infinite alternate;
            }
            
            @keyframes progressFill {
                0% {
                    width: 0%;
                }
                100% {
                    width: 100%;
                }
            }
            
            @keyframes progressGlow {
                0% {
                    opacity: 0.7;
                }
                100% {
                    opacity: 1;
                }
            }
            
            /* 移动端适配 */
            @media (max-width: 768px) {
                .thanks-hero {
                    padding: 24px 0;
                }
                
                .thanks-title {
                    font-size: 20px;
                }
                
                .success-animation {
                    margin-bottom: 20px;
                }
                
                .success-animation svg {
                    width: 60px;
                    height: 60px;
                }
                
                .sparkle {
                    font-size: 14px;
                }
                
                .download-status {
                    padding: 20px;
                }
                
                .download-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 20px;
                }
                
                .download-text {
                    font-size: 14px;
                }
                
                .countdown-container {
                    font-size: 12px;
                }
                
                .pixel-counter {
                    width: 24px;
                    height: 24px;
                    border-radius: 12px;
                    font-size: 12px;
                }
                
                .pixel-font {
                    font-size: 12px;
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
            navigator.clipboard.writeText('support@evedo.run').then(() => {
                // 像素风格反馈动效
                copyEmailBtn.innerHTML = '<span>已复制 ✓</span>';
                copyEmailBtn.style.animation = 'pixelSuccessFlash 0.3s ease';
                
                setTimeout(() => {
                    copyEmailBtn.innerHTML = '<span>复制</span>';
                    copyEmailBtn.style.animation = '';
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