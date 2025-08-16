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
        
        // 淡入动画
        requestAnimationFrame(() => {
            this.overlay.style.opacity = '1';
            this.modal.style.transform = 'translate(-50%, -50%) scale(1)';
        });
    }

    hideModal() {
        if (!this.overlay) return;

        // 清理倒计时
        if (this.countdownTimer) {
            clearTimeout(this.countdownTimer);
            this.countdownTimer = null;
        }

        // 淡出动画
        this.overlay.style.opacity = '0';
        this.modal.style.transform = 'translate(-50%, -50%) scale(0.95)';
        
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
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.45);
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.15s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // 创建弹窗
        this.modal = document.createElement('div');
        this.modal.className = 'puretext-payment-modal';
        this.modal.style.cssText = `
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            max-height: 80vh;
            overflow-y: auto;
            transform: translate(-50%, -50%) scale(0.95);
            transition: transform 0.15s ease;
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
            <div class="payment-header">
                <button class="contact-btn" type="button">联系我</button>
                <div class="logo-container">
                    <div class="logo-animation">📄</div>
                </div>
                <button class="close-btn" type="button">×</button>
            </div>
            <div class="payment-content">
                <h2 class="payment-title">打赏一片锅巴吧～</h2>
                <p class="payment-subtitle">0.2元/次</p>
                
                <div class="qr-section">
                    <div class="qr-container">
                        <div class="qr-code">
                            <img src="${chrome.runtime.getURL('assets/wechat_qr.png')}" alt="微信收款码" width="168" height="168">
                            <span class="qr-label">微信支付</span>
                        </div>
                        <div class="qr-code">
                            <img src="${chrome.runtime.getURL('assets/alipay_qr.png')}" alt="支付宝收款码" width="168" height="168">
                            <span class="qr-label">支付宝</span>
                        </div>
                    </div>
                    
                </div>
                
                <button class="payment-btn" type="button">已打赏</button>
                
            </div>
        `;

        this.applyPaymentPageStyles();
        this.attachPaymentPageEvents();
    }

    renderContactPage() {
        this.modal.innerHTML = `
            <div class="contact-header">
                <button class="back-btn" type="button">←</button>
                <h3 class="contact-title">联系我</h3>
                <button class="close-btn" type="button">×</button>
            </div>
            <div class="contact-content">
                <div class="contact-section">
                    <div class="xhs-qr">
                        <img src="${chrome.runtime.getURL('assets/xhs_qr.png')}" alt="小红书二维码" width="160" height="160">
                        <p>用小红书扫码关注</p>
                        <p>小红书：@你的账号</p>
                        <button class="xhs-link-btn" type="button">去主页</button>
                    </div>
                </div>
                
                <div class="contact-section">
                    <div class="email-section">
                        <span class="email-text">support@example.com</span>
                        <button class="copy-email-btn" type="button">复制</button>
                    </div>
                    <p class="contact-tip">有问题随时找我～</p>
                </div>
            </div>
        `;

        this.applyContactPageStyles();
        this.attachContactPageEvents();
    }

    renderThanksPage() {
        this.modal.innerHTML = `
            <div class="thanks-header">
                <button class="close-btn" type="button">×</button>
            </div>
            <div class="thanks-content">
                <div class="thanks-logo">🎉</div>
                <h2 class="thanks-title">谢谢支持！</h2>
                <p class="thanks-subtitle">正在下载，弹窗将<span class="countdown">3</span>秒后自动关闭</p>
            </div>
        `;

        this.applyThanksPageStyles();
        this.attachThanksPageEvents();
        this.startDownloadAndCountdown();
    }

    applyPaymentPageStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .payment-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid #f0f0f0;
            }
            .contact-btn, .close-btn {
                background: none;
                border: none;
                font-size: 14px;
                cursor: pointer;
                padding: 8px 12px;
                border-radius: 6px;
                transition: background-color 0.15s ease;
            }
            .contact-btn:hover, .close-btn:hover {
                background: rgba(0, 0, 0, 0.04);
            }
            .close-btn {
                font-size: 18px;
                font-weight: bold;
                color: #999;
            }
            .logo-container {
                flex: 1;
                text-align: center;
            }
            .logo-animation {
                font-size: 24px;
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            .payment-content {
                padding: 24px 20px;
                text-align: center;
            }
            .payment-title {
                font-size: 20px;
                font-weight: 600;
                margin: 0 0 8px 0;
                color: #333;
            }
            .payment-subtitle {
                font-size: 16px;
                color: #666;
                margin: 0 0 24px 0;
            }
            .qr-section {
                margin: 24px 0;
            }
            .qr-container {
                display: flex;
                justify-content: center;
                gap: 24px;
                margin-bottom: 16px;
            }
            .qr-code {
                text-align: center;
            }
            .qr-code img {
                border-radius: 8px;
                border: 1px solid #f0f0f0;
            }
            .qr-label {
                display: block;
                margin-top: 8px;
                font-size: 12px;
                color: #666;
            }
            .qr-tip {
                font-size: 12px;
                color: #999;
                margin: 0;
            }
            .payment-btn {
                width: 100%;
                padding: 12px;
                background: #1976d2;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.15s ease;
                margin: 24px 0 16px 0;
            }
            .payment-btn:hover {
                background: #1565c0;
            }
            .payment-footer {
                font-size: 12px;
                color: #999;
                margin: 0;
            }
            
            /* 移动端适配 */
            @media (max-width: 480px) {
                .puretext-payment-modal {
                    width: 90vw !important;
                    max-width: 360px !important;
                }
                .qr-container {
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                }
                .qr-code img {
                    width: 140px;
                    height: 140px;
                }
                .payment-btn {
                    min-height: 44px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    applyContactPageStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .contact-header {
                display: flex;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid #f0f0f0;
            }
            .back-btn {
                background: none;
                border: none;
                font-size: 16px;
                cursor: pointer;
                padding: 8px;
                margin-right: 16px;
                border-radius: 6px;
                transition: background-color 0.15s ease;
            }
            .back-btn:hover {
                background: rgba(0, 0, 0, 0.04);
            }
            .contact-title {
                flex: 1;
                text-align: center;
                margin: 0;
                font-size: 16px;
                font-weight: 500;
            }
            .contact-content {
                padding: 24px 20px;
            }
            .contact-section {
                margin-bottom: 24px;
                text-align: center;
            }
            .xhs-qr img {
                border-radius: 8px;
                border: 1px solid #f0f0f0;
                margin-bottom: 12px;
            }
            .xhs-qr p {
                margin: 8px 0;
                font-size: 14px;
                color: #666;
            }
            .xhs-link-btn {
                background: #ff2442;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 12px;
                cursor: pointer;
                transition: background-color 0.15s ease;
            }
            .xhs-link-btn:hover {
                background: #e6203a;
            }
            .email-section {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                margin-bottom: 12px;
            }
            .email-text {
                font-size: 14px;
                color: #333;
            }
            .copy-email-btn {
                background: #f5f5f5;
                border: 1px solid #ddd;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.15s ease;
            }
            .copy-email-btn:hover {
                background: #e5e5e5;
            }
            .contact-tip {
                font-size: 14px;
                color: #666;
                margin: 0;
            }
        `;
        document.head.appendChild(style);
    }

    applyThanksPageStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .thanks-header {
                display: flex;
                justify-content: flex-end;
                padding: 16px 20px;
            }
            .thanks-content {
                padding: 40px 20px 48px;
                text-align: center;
            }
            .thanks-logo {
                font-size: 48px;
                margin-bottom: 16px;
                animation: bounce 0.6s ease;
            }
            @keyframes bounce {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            .thanks-title {
                font-size: 20px;
                font-weight: 600;
                margin: 0 0 12px 0;
                color: #333;
            }
            .thanks-subtitle {
                font-size: 14px;
                color: #666;
                margin: 0;
            }
            .countdown {
                font-weight: 600;
                color: #1976d2;
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