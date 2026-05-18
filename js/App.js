/**
 * App - 项目核心调度器
 * 
 * 设计原则：
 * 1. 业务逻辑编排：作为 Entry Point，负责协调 TemplateManager, PreviewGenerator, 
 *    DownloadManager 和 EditorController 之间的交互。
 * 2. 状态管理：维护当前模板、配置及分发后的页面数据。
 * 3. 响应式更新：处理输入抖动 (Debounce)，确保 UI 响应流畅。
 */
class App {
    constructor() {
        this.templateManager = new TemplateManager();
        this.previewGenerator = new PreviewGenerator(this.templateManager);
        this.downloadManager = new DownloadManager();
        this.editorController = new EditorController();

        this.currentTemplate = 'starry-night';
        this.currentTemplateConfig = null;
        this.splitPages = [];
        this.splitter = null;
        
        this.elements = {};
        this.debounceTimer = null;
        this.shouldScrollToStart = false;
        this.aiUndoText = null;
    }

    init() {
        try {
            if (typeof MarkdownParser !== 'undefined') {
                MarkdownParser.init();
            }
            this.initElements();
            this.restoreAISettings();
            this.bindEvents();
            this.loadTemplates();
            this.setDefaultText();
            this.restoreEditMode();
        } catch (error) {
            console.error('[App] Initialization failed:', error);
            alert('应用初始化失败，请检查浏览器插件或设置是否禁用了脚本运行。');
        }
    }

    restoreEditMode() {
        try {
            const savedEditMode = localStorage.getItem('xhs_edit_mode');
            if (savedEditMode === 'true') {
                const body = document.body;
                body.classList.add('edit-mode');
                const toggle = this.elements.editModeToggle;
                if (toggle) {
                    toggle.classList.add('active');
                    toggle.innerHTML = '<i class="fas fa-compress-alt"></i>';
                    toggle.title = '退出专注模式';
                }
            }
        } catch (e) {
            console.warn('[App] LocalStorage access denied for edit mode');
        }
    }

    async setDefaultText() {
        try {
            const response = await fetch('data/default-text.md');
            const text = await response.text();
            this.elements.textInput.value = text;
        } catch (error) {
            console.error('Failed to load default text:', error);
            this.elements.textInput.value = '加载默认文本失败，请刷新页面重试。';
        }
    }

    initElements() {
        this.elements = {
            textInput: document.getElementById('text-input'),
            templateList: document.getElementById('template-list'),
            downloadAllBtn: document.getElementById('download-all-btn'),
            previewList: document.getElementById('preview-list'),
            previewCount: document.getElementById('preview-count'),
            previewPageInfo: document.getElementById('preview-page-info'),
            downloadCurrentBtn: document.getElementById('download-current-btn'),
            previewIndicators: document.getElementById('preview-indicators'),
            previewPrev: document.getElementById('preview-prev'),
            previewNext: document.getElementById('preview-next'),
            loading: document.getElementById('loading'),
            visualEditor: document.getElementById('visual-editor'),
            coverEditor: document.getElementById('cover-editor'),
            editorTabs: document.querySelectorAll('.editor-tab'),
            fontSizeInput: document.getElementById('font-size'),
            fontSizeValue: document.getElementById('font-size-value'),
            lineHeightInput: document.getElementById('line-height'),
            lineHeightValue: document.getElementById('line-height-value'),
            letterSpacingInput: document.getElementById('letter-spacing'),
            letterSpacingValue: document.getElementById('letter-spacing-value'),
            textPaddingInput: document.getElementById('text-padding'),
            textPaddingValue: document.getElementById('text-padding-value'),
            fontFamilySelect: document.getElementById('font-family'),
            h1ScaleValue: document.getElementById('h1-scale-value'),
            h2ScaleValue: document.getElementById('h2-scale-value'),
            h3ScaleValue: document.getElementById('h3-scale-value'),
            resetTemplateBtn: document.getElementById('reset-template-btn'),
            hasWatermarkCheck: document.getElementById('has-watermark'),
            watermarkTextInput: document.getElementById('watermark-text'),
            hasSignatureCheck: document.getElementById('has-signature'),
            signatureTextInput: document.getElementById('signature-text'),
            hasCoverCheck: document.getElementById('has-cover'),
            coverTitleInput: document.getElementById('cover-title'),
            coverFontSizeInput: document.getElementById('cover-font-size'),
            editModeToggle: document.getElementById('edit-mode-toggle'),
            syntaxHelpTrigger: document.getElementById('syntax-help-trigger'),
            syntaxHelpToggle: document.getElementById('syntax-help-toggle'),
            syntaxHelpTooltip: document.getElementById('syntax-help-tooltip'),
            syntaxSnippets: document.querySelectorAll('.syntax-snippet'),
            aiFormatBtn: document.getElementById('ai-format-btn'),
            aiFormatLabel: document.getElementById('ai-format-label'),
            aiUndoBtn: document.getElementById('ai-undo-btn'),
            aiSettingsToggle: document.getElementById('ai-settings-toggle'),
            aiSettingsPanel: document.getElementById('ai-settings-panel'),
            aiFormatStatus: document.getElementById('ai-format-status'),
            aiEndpointInput: document.getElementById('ai-endpoint'),
            aiApiKeyInput: document.getElementById('ai-api-key'),
            aiModelInput: document.getElementById('ai-model'),
            aiPromptPresetSelect: document.getElementById('ai-prompt-preset'),
            aiPromptInput: document.getElementById('ai-prompt')
        };

        this.downloadManager.setLoadingElement(this.elements.loading);
        this.editorController.init(this.elements);
        this.editorController.setOnConfigChange((config) => {
            // 如果开启了封面，且之前是关闭状态，标记需要滚动到开始位置
            if (config.hasCover && (!this.currentTemplateConfig || !this.currentTemplateConfig.hasCover)) {
                this.shouldScrollToStart = true;
            }

            this.currentTemplateConfig = { ...config };
            
            // 实时保存当前模板配置到本地（排除 coverImage，避免 LocalStorage 超限）
            if (this.currentTemplate) {
                const { coverImage, ...safeConfig } = config;
                localStorage.setItem(`xhs_tpl_config_${this.currentTemplate}`, JSON.stringify(safeConfig));
            }
            
            this.generatePreview();
        });
        
        // 连接导出格式选择器
        this.editorController.setOnExportFormatChange((format) => {
            this.downloadManager.setExportFormat(format);
        });
    }

    bindEvents() {
        this.elements.textInput.addEventListener('input', () => this.schedulePreview(500));
        this.elements.downloadAllBtn.addEventListener('click', () => this.downloadAllImages());
        this.elements.downloadCurrentBtn.addEventListener('click', () => this.downloadCurrentImage());
        this.elements.resetTemplateBtn.addEventListener('click', () => this.resetTemplate());
        this.elements.previewList.addEventListener('scroll', 
            () => requestAnimationFrame(() => this.updateActiveIndicator())
        );

        this.elements.previewPrev.addEventListener('click', () => {
            this.elements.previewList.scrollLeft -= this.elements.previewList.clientWidth;
        });

        this.elements.previewNext.addEventListener('click', () => {
            this.elements.previewList.scrollLeft += this.elements.previewList.clientWidth;
        });

        if (this.elements.editModeToggle) {
            this.elements.editModeToggle.addEventListener('click', () => this.toggleEditMode());
        }
        if (this.elements.syntaxHelpToggle) {
            this.elements.syntaxHelpToggle.addEventListener('click', (event) => {
                event.stopPropagation();
                this.toggleSyntaxHelp();
            });
        }
        this.elements.syntaxSnippets?.forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.insertSyntaxSnippet(button);
            });
        });
        document.addEventListener('click', (event) => {
            if (!this.elements.syntaxHelpTrigger?.contains(event.target)) {
                this.closeSyntaxHelp();
            }
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeSyntaxHelp();
            }
        });

        if (this.elements.aiFormatBtn) {
            this.elements.aiFormatBtn.addEventListener('click', () => this.formatWithAI());
        }
        if (this.elements.aiUndoBtn) {
            this.elements.aiUndoBtn.addEventListener('click', () => this.undoAIFormat());
        }
        if (this.elements.aiSettingsToggle) {
            this.elements.aiSettingsToggle.addEventListener('click', () => this.toggleAISettings());
        }
        [this.elements.aiEndpointInput, this.elements.aiApiKeyInput, this.elements.aiModelInput].forEach(input => {
            input?.addEventListener('change', () => this.saveAISettings());
        });
        if (this.elements.aiPromptPresetSelect) {
            this.elements.aiPromptPresetSelect.addEventListener('change', () => {
                this.applyAIPromptPreset(this.elements.aiPromptPresetSelect.value);
                this.updateAIActionLabel();
                this.saveAISettings();
            });
        }
        if (this.elements.aiPromptInput) {
            this.elements.aiPromptInput.addEventListener('input', () => {
                this.syncAIPromptPresetFromPrompt();
                this.updateAIActionLabel();
                this.saveAISettings();
            });
        }
    }

    toggleSyntaxHelp() {
        const trigger = this.elements.syntaxHelpTrigger;
        const toggle = this.elements.syntaxHelpToggle;
        if (!trigger || !toggle) return;

        const willOpen = !trigger.classList.contains('is-open');
        trigger.classList.toggle('is-open', willOpen);
        toggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    }

    closeSyntaxHelp() {
        const trigger = this.elements.syntaxHelpTrigger;
        const toggle = this.elements.syntaxHelpToggle;
        if (!trigger || !toggle) return;

        trigger.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
    }

    insertSyntaxSnippet(button) {
        const input = this.elements.textInput;
        if (!input) return;

        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? input.value.length;
        const selectedText = input.value.slice(start, end);
        const insertText = button.dataset.insert;
        const prefix = button.dataset.prefix || '';
        const suffix = button.dataset.suffix || '';
        const placeholder = button.dataset.placeholder || '';
        const snippet = insertText !== undefined
            ? this.decodeSyntaxSnippet(insertText)
            : `${this.decodeSyntaxSnippet(prefix)}${selectedText || placeholder}${this.decodeSyntaxSnippet(suffix)}`;

        input.setRangeText(snippet, start, end, 'end');
        input.focus();
        input.dispatchEvent(new Event('input', { bubbles: true }));
        this.closeSyntaxHelp();
    }

    decodeSyntaxSnippet(value) {
        return String(value || '').replace(/\\n/g, '\n');
    }

    getAIPromptPresets() {
        if (typeof AIFormatter === 'undefined') return {};
        return AIFormatter.getPromptPresets();
    }

    resolveAIPromptPreset(promptPreset, prompt) {
        const presets = this.getAIPromptPresets();
        const value = String(prompt || '').trim();
        if (promptPreset && presets[promptPreset] && presets[promptPreset].prompt.trim() === value) {
            return promptPreset;
        }

        const matchedPreset = Object.keys(presets).find(key => presets[key].prompt.trim() === value);
        return matchedPreset || 'custom';
    }

    getPromptForPreset(promptPreset) {
        const presets = this.getAIPromptPresets();
        return presets[promptPreset]?.prompt || presets.layout?.prompt || '';
    }

    applyAIPromptPreset(promptPreset) {
        if (!this.elements.aiPromptInput || promptPreset === 'custom') return;

        const prompt = this.getPromptForPreset(promptPreset);
        if (prompt) this.elements.aiPromptInput.value = prompt;
    }

    syncAIPromptPresetFromPrompt() {
        const select = this.elements.aiPromptPresetSelect;
        const input = this.elements.aiPromptInput;
        if (!select || !input) return;

        select.value = this.resolveAIPromptPreset(select.value, input.value);
    }

    updateAIActionLabel() {
        const label = this.elements.aiFormatLabel;
        if (!label || typeof AIFormatter === 'undefined') return;

        const promptPreset = this.elements.aiPromptPresetSelect?.value || 'layout';
        label.textContent = AIFormatter.getActionLabel(promptPreset);
    }

    restoreAISettings() {
        if (!this.elements.aiEndpointInput || typeof AIFormatter === 'undefined') return;

        let settings = AIFormatter.getDefaultConfig();
        try {
            const saved = localStorage.getItem('xhs_ai_formatter_settings');
            if (saved) settings = { ...settings, ...JSON.parse(saved) };
        } catch (error) {
            console.warn('[App] Failed to load AI formatter settings:', error);
        }

        this.elements.aiEndpointInput.value = settings.endpoint || '';
        this.elements.aiApiKeyInput.value = settings.apiKey || '';
        this.elements.aiModelInput.value = settings.model || '';
        if (this.elements.aiPromptInput) {
            this.elements.aiPromptInput.value = settings.prompt || this.getPromptForPreset(settings.promptPreset || 'layout');
        }
        if (this.elements.aiPromptPresetSelect) {
            this.elements.aiPromptPresetSelect.value = this.resolveAIPromptPreset(
                settings.promptPreset || 'layout',
                this.elements.aiPromptInput?.value || settings.prompt
            );
        }
        this.updateAIActionLabel();
    }

    getAISettings() {
        return {
            endpoint: this.elements.aiEndpointInput?.value?.trim() || '',
            apiKey: this.elements.aiApiKeyInput?.value?.trim() || '',
            model: this.elements.aiModelInput?.value?.trim() || '',
            promptPreset: this.elements.aiPromptPresetSelect?.value || 'layout',
            prompt: this.elements.aiPromptInput?.value || '',
            timeoutMs: typeof AIFormatter !== 'undefined' ? AIFormatter.DEFAULT_TIMEOUT_MS : 180000
        };
    }

    saveAISettings() {
        try {
            localStorage.setItem('xhs_ai_formatter_settings', JSON.stringify(this.getAISettings()));
        } catch (error) {
            console.warn('[App] Failed to save AI formatter settings:', error);
        }
    }

    toggleAISettings() {
        const panel = this.elements.aiSettingsPanel;
        const toggle = this.elements.aiSettingsToggle;
        if (!panel || !toggle) return;

        const isOpen = panel.hasAttribute('hidden');
        panel.toggleAttribute('hidden', !isOpen);
        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        toggle.classList.toggle('active', isOpen);

        if (isOpen) {
            requestAnimationFrame(() => this.scrollAISettingsIntoView());
        }
    }

    scrollAISettingsIntoView() {
        const panel = this.elements.aiSettingsPanel;
        const formatPanel = panel?.closest('.ai-format-panel');
        const scrollContainer = panel?.closest('.left-panel');
        if (!panel || !formatPanel || !scrollContainer) return;

        const containerRect = scrollContainer.getBoundingClientRect();
        const targetRect = formatPanel.getBoundingClientRect();
        const topOffset = 4;
        const targetTop = scrollContainer.scrollTop + targetRect.top - containerRect.top - topOffset;

        scrollContainer.scrollTo({
            top: Math.max(0, targetTop),
            behavior: 'smooth'
        });
    }

    setAIStatus(message, type = '') {
        const status = this.elements.aiFormatStatus;
        if (!status) return;
        status.textContent = message || '';
        status.className = `ai-format-status${type ? ` ${type}` : ''}`;
    }

    setAIFormattingState(isLoading) {
        const button = this.elements.aiFormatBtn;
        if (!button) return;

        button.disabled = isLoading;
        button.classList.toggle('loading', isLoading);
    }

    async formatWithAI() {
        if (typeof AIFormatter === 'undefined') {
            this.setAIStatus('AI 排版模块加载失败，请刷新页面重试。', 'error');
            return;
        }

        const originalText = this.elements.textInput.value;
        if (!originalText.trim()) {
            this.setAIStatus('请先粘贴需要排版的文字。', 'error');
            return;
        }

        this.saveAISettings();
        this.setAIFormattingState(true);
        this.setAIStatus('AI 正在整理文案...');

        try {
            const formattedText = await AIFormatter.formatText(this.getAISettings(), originalText);
            this.aiUndoText = originalText;
            this.elements.textInput.value = formattedText;
            if (this.elements.aiUndoBtn) this.elements.aiUndoBtn.disabled = false;
            await this.generatePreview();
            this.setAIStatus('排版完成，右侧预览已更新。', 'success');
        } catch (error) {
            console.error('[App] AI formatting failed:', error);
            this.setAIStatus(error.message || 'AI 排版失败，请检查接口配置。', 'error');
        } finally {
            this.setAIFormattingState(false);
        }
    }

    undoAIFormat() {
        if (this.aiUndoText === null) return;

        this.elements.textInput.value = this.aiUndoText;
        this.aiUndoText = null;
        if (this.elements.aiUndoBtn) this.elements.aiUndoBtn.disabled = true;
        this.setAIStatus('已恢复 AI 排版前的原文。');
        this.generatePreview();
    }

    toggleEditMode() {
        const body = document.body;
        const isEditMode = body.classList.toggle('edit-mode');
        const toggle = this.elements.editModeToggle;
        
        if (toggle) {
            toggle.classList.toggle('active', isEditMode);
            toggle.innerHTML = isEditMode 
                ? '<i class="fas fa-compress-alt"></i>' 
                : '<i class="fas fa-expand-alt"></i>';
            toggle.title = isEditMode ? '退出专注模式' : '专注编辑模式';
        }

        localStorage.setItem('xhs_edit_mode', isEditMode ? 'true' : 'false');
    }

    updateActiveIndicator() {
        if (!this.elements.previewIndicators) return;
        
        const scrollLeft = this.elements.previewList.scrollLeft;
        const width = this.elements.previewList.clientWidth;
        const index = Math.min(
            Math.max(Math.round(scrollLeft / width), 0),
            Math.max(this.splitPages.length - 1, 0)
        );
        
        const indicators = this.elements.previewIndicators.querySelectorAll('.preview-indicator');
        indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === index);
        });

        this.updatePreviewToolbar(index);

        if (this.elements.previewPrev) {
            this.elements.previewPrev.disabled = scrollLeft <= 0;
        }
        if (this.elements.previewNext) {
            const maxScroll = this.elements.previewList.scrollWidth - this.elements.previewList.clientWidth;
            this.elements.previewNext.disabled = scrollLeft >= maxScroll - 5;
        }
    }

    updatePreviewToolbar(index = 0) {
        const total = this.splitPages.length;
        if (this.elements.previewPageInfo) {
            this.elements.previewPageInfo.textContent = total > 0
                ? `第 ${index + 1} 张 / 共 ${total} 张`
                : '第 0 张 / 共 0 张';
        }
        if (this.elements.downloadCurrentBtn) {
            this.elements.downloadCurrentBtn.disabled = total === 0;
        }
    }

    renderIndicators(count) {
        if (!this.elements.previewIndicators) return;
        this.elements.previewIndicators.innerHTML = '';
        if (count <= 1) return;

        for (let i = 0; i < count; i++) {
            const indicator = document.createElement('div');
            indicator.className = 'preview-indicator';
            if (i === 0) indicator.classList.add('active');
            this.elements.previewIndicators.appendChild(indicator);
        }
    }

    schedulePreview(delay = 500) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.generatePreview(), delay);
    }

    async loadTemplates() {
        try {
            await this.templateManager.init();
            this.renderTemplateList();
            
            let lastId = this.currentTemplate;
            try {
                lastId = localStorage.getItem('xhs_last_template_id') || this.currentTemplate;
            } catch (e) {}
            
            await this.selectTemplate(lastId);
        } catch (error) {
            console.error('[App] Failed to load templates:', error);
            this.showEmptyState(`模板初始化失败: ${error.message}`);
        }
    }

    renderTemplateList() {
        if (!this.elements.templateList) return;
        this.elements.templateList.innerHTML = '';
        const templates = this.templateManager.getAllTemplates();

        templates.forEach(template => {
            const item = document.createElement('div');
            item.className = 'template-item';
            if (template.id === this.currentTemplate) item.classList.add('active');

            const name = document.createElement('div');
            name.className = 'template-item-name';
            name.textContent = template.name;
            
            const desc = document.createElement('div');
            desc.className = 'template-item-desc';
            desc.textContent = template.description;

            item.appendChild(name);
            item.appendChild(desc);
            item.addEventListener('click', () => this.selectTemplate(template.id));
            this.elements.templateList.appendChild(item);
        });
    }

    async selectTemplate(templateId) {
        try {
            const template = await this.templateManager.loadTemplate(templateId);
            if (!template) {
                console.error(`[App] Template not found: ${templateId}`);
                return;
            }

            this.currentTemplate = templateId;
            
            // 尝试从本地存储加载用户自定义配置
            let savedConfig = null;
            try {
                savedConfig = localStorage.getItem(`xhs_tpl_config_${templateId}`);
                localStorage.setItem('xhs_last_template_id', templateId);
            } catch (e) {
                console.warn('[App] LocalStorage access denied');
            }
            
            // 使用深度克隆防止污染 templateManager 中的原始配置
            const baseConfig = JSON.parse(JSON.stringify(template.config));

            if (savedConfig) {
                try {
                    this.currentTemplateConfig = { ...baseConfig, ...JSON.parse(savedConfig) };
                } catch (e) {
                    console.error('[App] Failed to parse saved config:', e);
                    this.currentTemplateConfig = baseConfig;
                }
            } else {
                this.currentTemplateConfig = baseConfig;
            }
            this.currentTemplateConfig.hasSignature = false;

            this.renderTemplateList();
            this.editorController.setConfig(this.currentTemplateConfig);
            this.generatePreview();
        } catch (error) {
            console.error('[App] selectTemplate failed:', error);
        }
    }

    async generatePreview() {
        const text = this.elements.textInput.value;
        if (!text) {
            this.showEmptyState('请输入文字内容');
            this.elements.previewCount.textContent = '共 0 张图片';
            this.elements.downloadAllBtn.disabled = true;
            this.splitPages = [];
            this.renderIndicators(0);
            this.updatePreviewToolbar(0);
            return;
        }

        if (typeof marked === 'undefined') {
            this.showEmptyState('Markdown 解析器 (marked.js) 加载失败，请检查网络或刷新重试。');
            console.error('[App] marked library is missing');
            return;
        }

        if (!this.currentTemplateConfig) return;

        const scrollLeft = this.elements.previewList.scrollLeft;
        this.elements.loading.classList.add('active');
        
        try {
            if (!this.splitter) {
                this.splitter = new TextSplitter(this.currentTemplateConfig, this.currentTemplate);
            } else {
                this.splitter.updateConfig(this.currentTemplateConfig, this.currentTemplate);
            }
            this.splitPages = await this.splitter.split(text);

            this.elements.previewCount.textContent = `共 ${this.splitPages.length} 张图片`;

            if (this.splitPages.length === 0) {
                this.elements.previewList.innerHTML = '';
                this.showEmptyState('没有可生成的内容，请检查输入格式。');
                this.elements.loading.classList.remove('active');
                this.elements.downloadAllBtn.disabled = true;
                this.renderIndicators(0);
                this.updatePreviewToolbar(0);
                return;
            }

            this.elements.downloadAllBtn.disabled = false;
            this.renderIndicators(this.splitPages.length);

            const renderPromises = this.splitPages.map(async (pageLayouts, index) => {
                const previewItem = await this.previewGenerator.createPreviewItem(
                    pageLayouts,
                    index,
                    this.splitPages.length,
                    this.currentTemplate,
                    this.currentTemplateConfig,
                    (idx) => this.downloadSingleImage(idx)
                );
                return previewItem;
            });

            const items = await Promise.all(renderPromises);
            
            // 渲染完成后一次性更新 DOM
            this.elements.previewList.innerHTML = '';
            items.forEach(item => this.elements.previewList.appendChild(item));
            this.elements.loading.classList.remove('active');
            
            requestAnimationFrame(() => {
                if (this.shouldScrollToStart) {
                    this.elements.previewList.scrollLeft = 0;
                    this.shouldScrollToStart = false;
                } else {
                    this.elements.previewList.scrollLeft = scrollLeft;
                }
                this.updateActiveIndicator();
            });
        } catch (error) {
            console.error('[App] Preview generation failed:', error);
            this.elements.loading.classList.remove('active');
            this.showEmptyState(`生成预览出错: ${error.message}`);
        }
    }

    showEmptyState(message) {
        this.elements.previewList.innerHTML = '';
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        
        const icon = document.createElement('div');
        icon.className = 'empty-state-icon';
        icon.textContent = '📝';
        
        const text = document.createElement('div');
        text.textContent = message;
        
        emptyState.appendChild(icon);
        emptyState.appendChild(text);
        this.elements.previewList.appendChild(emptyState);
    }

    downloadSingleImage(index) {
        this.downloadManager.download(this.splitPages[index], this.currentTemplateConfig, this.currentTemplate, index, this.splitPages.length);
    }

    downloadCurrentImage() {
        if (!this.splitPages.length) return;
        const index = Math.min(
            Math.max(Math.round(this.elements.previewList.scrollLeft / this.elements.previewList.clientWidth), 0),
            this.splitPages.length - 1
        );
        this.downloadSingleImage(index);
    }

    downloadAllImages() {
        this.downloadManager.downloadAll(this.splitPages, this.currentTemplateConfig, this.currentTemplate, this.elements.downloadAllBtn);
    }

    resetTemplate() {
        const template = this.templateManager.getTemplate(this.currentTemplate);
        if (template) {
            localStorage.removeItem(`xhs_tpl_config_${this.currentTemplate}`);
            // 使用深度克隆恢复初始配置
            this.currentTemplateConfig = JSON.parse(JSON.stringify(template.config));
            this.editorController.setConfig(this.currentTemplateConfig);
            this.generatePreview();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 全局错误捕获
    window.onerror = function(message, source, lineno, colno, error) {
        console.error('[Global Error]', message, error);
        // 如果渲染卡住了，尝试恢复 UI
        const loading = document.getElementById('loading');
        if (loading) loading.classList.remove('active');
        return false;
    };

    window.onunhandledrejection = function(event) {
        console.error('[Unhandled Rejection]', event.reason);
        const loading = document.getElementById('loading');
        if (loading) loading.classList.remove('active');
    };

    const app = new App();
    app.init();
});
