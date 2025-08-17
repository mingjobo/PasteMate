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
                    ${chrome.i18n.getMessage('contactService')}
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
                            <img src="${chrome.runtime.getURL('assets/logo.gif')}" alt="PureText Logo" class="logo-gif">
                        </div>
                    </div>
                    <h1 class="main-title pixel-font">${chrome.i18n.getMessage('paymentModalTitle')}</h1>
                    <div class="price-badge pixel-badge">
                        <span class="pixel-font">${chrome.i18n.getMessage('paymentPrice')}</span>
                    </div>
                    
                </div>

                <div class="payment-section">
                    <div class="payment-methods">
                        <div class="qr-container">
                            <img src="${chrome.runtime.getURL('assets/wechat_qr.png')}" alt="微信收款码" class="qr-image">
                        </div>
                        
                        <div class="qr-container">
                            <img src="${chrome.runtime.getURL('assets/alipay_qr.png')}" alt="支付宝收款码" class="qr-image">
                        </div>
                    </div>
                </div>

                <div class="action-section">
                    <button class="payment-btn pixel-btn" type="button">
                        <span class="pixel-font">${chrome.i18n.getMessage('paymentConfirm')}</span>
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
                </button>
                <h3 class="contact-title pixel-font">${chrome.i18n.getMessage('contactTitle')}</h3>
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
                            <h4 class="contact-method-title">${chrome.i18n.getMessage('xiaohongshuFollow')}</h4>
                        </div>
                        <div class="qr-container pixel-qr-clean">
                            <img src="${chrome.runtime.getURL('assets/xhs_qr.png')}" alt="小红书二维码" class="qr-image-clean">
                        </div>
                        
                    </div>

                    <div class="contact-method email-method pixel-card-clean">
                        <div class="contact-method-header">
                            <div class="contact-method-icon pixel-icon-unified">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <rect x="2" y="4" width="20" height="16" rx="2" fill="white"/>
                                    <path d="M2 6l10 7 10-7" stroke="#9B8CFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <h4 class="contact-method-title">${chrome.i18n.getMessage('emailContact')}</h4>
                        </div>
                        <div class="email-row">
                            <span class="email-address-clean">support@vedo.run</span>
                            <button class="copy-email-btn pixel-btn-primary" type="button">
                                <span>${chrome.i18n.getMessage('copyEmailButton')}</span>
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
                    <div class="download-success-animation">
                        <div class="download-icon-container">
                            <div class="download-background-circle"></div>
                            <div class="download-icon-main">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M7 10l5 5 5-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="download-arrow"/>
                                    <path d="M12 15V3" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <div class="success-checkmark">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" fill="#34C759"/>
                                    <path d="M8 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="checkmark-path"/>
                                </svg>
                            </div>
                        </div>
                        
                        <div class="floating-particles">
                            <div class="particle particle-1">✨</div>
                            <div class="particle particle-2">⭐</div>
                            <div class="particle particle-3">💫</div>
                            <div class="particle particle-4">✨</div>
                        </div>
                    </div>
                    
                    <div class="success-text">
                        <h1 class="main-message">${chrome.i18n.getMessage('downloadSuccess')}</h1>
                        <p class="sub-message">${chrome.i18n.getMessage('thanksDonation')}</p>
                    </div>
                </div>
            </div>
        `;

        this.applyThanksPageStyles();
        this.attachThanksPageEvents();
        this.triggerDownload();
        this.startAutoCloseTimer();
    }

    applyPaymentPageStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&display=swap');
            
            .pixel-font {
                font-family: 'Inter', 'PingFang SC', sans-serif;
                font-weight: 600;
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
                background: linear-gradient(135deg, #5DADE2 0%, #3498DB 100%);
                color: white;
                border: none;
                padding: 10px 16px;
                border-radius: 16px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                font-family: 'Inter', 'PingFang SC', sans-serif;
                box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
            }
            
            .contact-btn:hover {
                background: linear-gradient(135deg, #3498DB 0%, #2980B9 100%);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
            }
            
            .contact-btn:active {
                transform: translateY(0);
                box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
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
            
            .logo-gif {
                width: 64px;
                height: 64px;
                border-radius: 16px;
                object-fit: contain;
            }
            
            @keyframes logoFloat {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-3px); }
            }
            
            .main-title {
                font-size: 24px;
                font-weight: 700;
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
                font-weight: 600;
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
            
            .qr-container {
                display: flex;
                justify-content: center;
                align-items: center;
                background: #FFFFFF;
                border: 1px solid #E5E7EB;
                border-radius: 20px;
                padding: 20px;
                transition: all 0.2s ease;
                position: relative;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
            }
            
            .qr-container:hover {
                border-color: #D1D5DB;
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
            }
            
            .qr-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 8px;
            }
            
            .action-section {
                text-align: center;
            }
            
            .pixel-btn {
                display: inline-block;
                width: 100%;
                padding: 16px 24px;
                background: linear-gradient(135deg, #5DADE2 0%, #3498DB 100%);
                color: white;
                border: none;
                border-radius: 20px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
                font-family: 'Inter', 'PingFang SC', sans-serif;
                box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
            }
            
            .pixel-btn:hover {
                background: linear-gradient(135deg, #3498DB 0%, #2980B9 100%);
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(52, 152, 219, 0.4);
            }
            
            .pixel-btn:active {
                transform: translateY(0);
                box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
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
                    width: 100%;
                    height: 100%;
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
                display: flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                background: #F8F9FA;
                color: #64748b;
                border: none;
                border-radius: 18px;
                cursor: pointer;
                transition: all 0.2s ease;
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
                font-size: 18px;
                font-weight: 600;
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
                background: linear-gradient(135deg, #5DADE2 0%, #3498DB 100%);
                border-radius: 20px;
                flex-shrink: 0;
                box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
            }
            
            .contact-method-title {
                font-size: 18px;
                font-weight: 600;
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
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 8px;
            }
            
            .pixel-text {
                text-align: center;
                font-size: 14px;
                font-weight: 600;
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
                font-weight: 600;
                color: #1a1a1a;
                font-family: 'Inter', 'Monaco', monospace;
            }
            
            /* 主要复制按钮 */
            .pixel-btn-primary {
                display: inline-flex;
                align-items: center;
                background: linear-gradient(135deg, #5DADE2 0%, #3498DB 100%);
                color: white;
                border: none;
                border-radius: 16px;
                padding: 12px 20px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                font-family: 'Inter', 'PingFang SC', sans-serif;
                flex-shrink: 0;
                box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
            }
            
            .pixel-btn-primary:hover {
                background: linear-gradient(135deg, #3498DB 0%, #2980B9 100%);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
            }
            
            .pixel-btn-primary:active {
                transform: translateY(0);
                box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
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
                    width: 100%;
                    height: 100%;
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
                padding: 48px 0;
            }
            
            /* 下载成功动画容器 */
            .download-success-animation {
                position: relative;
                display: inline-block;
                margin-bottom: 32px;
            }
            
            .download-icon-container {
                position: relative;
                display: inline-block;
                width: 80px;
                height: 80px;
            }
            
            /* 背景圆圈 */
            .download-background-circle {
                position: absolute;
                top: 0;
                left: 0;
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 50%;
                animation: downloadPulse 2s ease-in-out infinite;
            }
            
            @keyframes downloadPulse {
                0%, 100% {
                    transform: scale(1);
                    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4);
                }
                50% {
                    transform: scale(1.05);
                    box-shadow: 0 0 0 10px rgba(102, 126, 234, 0);
                }
            }
            
            /* 下载图标 */
            .download-icon-main {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 2;
            }
            
            .download-arrow {
                stroke-dasharray: 20;
                stroke-dashoffset: 20;
                animation: downloadArrow 0.6s ease-out 0.2s forwards;
            }
            
            @keyframes downloadArrow {
                to {
                    stroke-dashoffset: 0;
                }
            }
            
            /* 成功标记 */
            .success-checkmark {
                position: absolute;
                top: -5px;
                right: -5px;
                opacity: 0;
                transform: scale(0);
                animation: successAppear 0.3s ease-out 0.9s forwards;
            }
            
            @keyframes successAppear {
                0% {
                    opacity: 0;
                    transform: scale(0) rotate(180deg);
                }
                50% {
                    opacity: 1;
                    transform: scale(1.2) rotate(0deg);
                }
                100% {
                    opacity: 1;
                    transform: scale(1) rotate(0deg);
                }
            }
            
            .checkmark-path {
                stroke-dasharray: 12;
                stroke-dashoffset: 12;
                animation: drawCheckmark 0.25s ease-out 1.05s forwards;
            }
            
            @keyframes drawCheckmark {
                to {
                    stroke-dashoffset: 0;
                }
            }
            
            /* 浮动粒子 */
            .floating-particles {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
            }
            
            .particle {
                position: absolute;
                font-size: 16px;
                opacity: 0;
                animation: particleFloat 1.2s ease-out infinite;
            }
            
            .particle-1 {
                top: -30px;
                left: -20px;
                animation-delay: 1.4s;
            }
            
            .particle-2 {
                top: -25px;
                right: -25px;
                animation-delay: 1.55s;
            }
            
            .particle-3 {
                bottom: -30px;
                left: -15px;
                animation-delay: 1.7s;
            }
            
            .particle-4 {
                bottom: -25px;
                right: -20px;
                animation-delay: 1.85s;
            }
            
            @keyframes particleFloat {
                0% {
                    opacity: 0;
                    transform: translateY(0px) scale(0.8);
                }
                30% {
                    opacity: 1;
                    transform: translateY(-8px) scale(1);
                }
                70% {
                    opacity: 1;
                    transform: translateY(-15px) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translateY(-25px) scale(0.8);
                }
            }
            
            /* 文本区域 */
            .success-text {
                margin-bottom: 24px;
            }
            
            .main-message {
                font-size: 32px;
                font-weight: 600;
                color: #1a1a1a;
                margin: 0 0 8px 0;
                line-height: 1.2;
                font-family: 'Inter', 'PingFang SC', sans-serif;
                opacity: 0;
                animation: textSlideUp 0.4s ease-out 0.6s forwards;
            }
            
            .sub-message {
                font-size: 16px;
                font-weight: 400;
                color: #64748b;
                margin: 0;
                font-family: 'Inter', 'PingFang SC', sans-serif;
                opacity: 0;
                animation: textSlideUp 0.4s ease-out 0.2s forwards;
            }
            
            @keyframes textSlideUp {
                0% {
                    opacity: 0;
                    transform: translateY(20px);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            /* 移除文件信息相关样式 */
            
            /* 移动端适配 */
            @media (max-width: 768px) {
                .thanks-hero {
                    padding: 40px 0;
                }
                
                .download-icon-container {
                    width: 70px;
                    height: 70px;
                }
                
                .download-background-circle {
                    width: 70px;
                    height: 70px;
                }
                
                .download-icon-main svg {
                    width: 28px;
                    height: 28px;
                }
                
                .success-checkmark svg {
                    width: 20px;
                    height: 20px;
                }
                
                .main-message {
                    font-size: 28px;
                }
                
                .sub-message {
                    font-size: 14px;
                }
                
                .particle {
                    font-size: 14px;
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
            navigator.clipboard.writeText('support@vedo.run').then(() => {
                // 像素风格反馈动效
                copyEmailBtn.innerHTML = `<span>${chrome.i18n.getMessage('emailCopied')}</span>`;
                copyEmailBtn.style.animation = 'pixelSuccessFlash 0.3s ease';
                
                setTimeout(() => {
                    copyEmailBtn.innerHTML = `<span>${chrome.i18n.getMessage('copyEmailButton')}</span>`;
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

    startAutoCloseTimer() {
        // 动画完成后自动关闭弹窗
        // 优化后的动画序列：2.5秒内完成所有动画
        this.countdownTimer = setTimeout(() => {
            this.hideModal();
        }, 2500);
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
                <h2 class="thanks-title">${chrome.i18n.getMessage('downloadFailed')}</h2>
                <div class="error-actions">
                    <button class="retry-btn" type="button">${chrome.i18n.getMessage('retryDownload')}</button>
                    <button class="contact-support-btn" type="button">${chrome.i18n.getMessage('feedbackButton')}</button>
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