/**
 * AIFormatter - OpenAI-compatible text formatting client.
 *
 * The module is intentionally UI-free so it can be tested with Node and reused
 * by the browser editor without a build step.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    } else {
        root.AIFormatter = api.AIFormatter;
    }
})(typeof self !== 'undefined' ? self : this, function () {
    class AIFormatter {
        static MAX_INPUT_LENGTH = 10000;
        static DEFAULT_MODEL = 'gpt-5.4';
        static DEFAULT_TIMEOUT_MS = 180000;

        static getDefaultConfig() {
            return {
                endpoint: 'https://api.openai.com/v1',
                apiKey: '',
                model: this.DEFAULT_MODEL,
                timeoutMs: this.DEFAULT_TIMEOUT_MS,
                promptPreset: 'layout',
                prompt: this.getPromptPresets().layout.prompt
            };
        }

        static normalizeEndpoint(endpoint) {
            const value = String(endpoint || this.getDefaultConfig().endpoint).trim().replace(/\/+$/, '');
            if (/\/chat\/completions$/i.test(value)) return value;
            return `${value}/chat/completions`;
        }

        static getLayoutPromptTemplate() {
            return [
                '请把下面这段没有格式的纯文本整理成适合小红书 3:4 文字卡片的 Markdown。',
                '',
                '目标：这是排版任务，不是总结任务。主要做短标题、分段、层级、加粗重点和少量表情，让原文更适合卡片展示。',
                '',
                '排版规则：',
                '1. 只输出 Markdown 正文，不要解释，不要包裹代码块。',
                '2. 不要使用 ---、***、___ 分割线，因为它们会触发强制分页并造成空白页。',
                '3. 一级标题只能有 1 个，尽量控制在 14 个中文字符以内，最多 1 个表情符号，不要写成长句。',
                '4. 如果原文第一句或原有大标题很长，只把它改成短标题；标题里放不下的信息自然放回正文。',
                '5. 二级标题尽量控制在 10 个中文字符以内，最多 3 到 5 个，不要连续堆标题。',
                '6. 每段控制在 1 到 2 行，每组列表控制在 3 到 5 条；只调整换行和层级，不要主动总结、压缩或扩写原文。',
                '7. 重点加粗只标关键词或短句，不要整段加粗，不要每句话都加粗。',
                '8. 空行最多连续 1 行，不要输出封面、目录、结语、分割线或占位内容。',
                '9. 保持原文的主要信息和表达顺序，不要编造事实、数据、案例、价格、日期或人名。',
                '',
                '结构建议：',
                '- 原文很短：1 个短标题 + 2 到 4 个短段落即可，不要强行拆很多层级。',
                '- 原文较长：1 个短标题 + 3 到 5 个小节，每节用短段落或列表承载。',
                '- 可以适度使用表情，但每个标题最多 1 个，整体不要花哨。',
                '',
                '原文：'
            ].join('\n');
        }

        static getWritingPromptTemplate() {
            return [
                '你的任务是以小红书博主的文章结构，以我给出的主题写一篇帖子推荐。你的回答应包括使用表情符号来增加趣味和互动，以及与每个段落相匹配的图片。请以一个引人入胜的介绍开始，为你的推荐设置基调。然后，提供至少三个与主题相关的段落，突出它们的独特特点和吸引力。在你的写作中使用表情符号，使它更加引人入胜和有趣。对于每个段落，请提供一个与描述内容相匹配的图片。这些图片应该视觉上吸引人，并帮助你的描述更加生动形象。我给出的主题是：'
            ].join('\n');
        }

        static getPromptPresets() {
            return {
                layout: {
                    label: 'AI 智能排版',
                    actionLabel: 'AI 智能排版',
                    prompt: this.getLayoutPromptTemplate()
                },
                writer: {
                    label: '写作助手',
                    actionLabel: 'AI 写作助手',
                    prompt: this.getWritingPromptTemplate()
                }
            };
        }

        static getActionLabel(promptPreset) {
            const presets = this.getPromptPresets();
            return presets[promptPreset]?.actionLabel || 'AI 自定义生成';
        }

        static getPromptTemplate(promptTemplate) {
            const prompt = String(promptTemplate || '').trim();
            return prompt || this.getPromptPresets().layout.prompt;
        }

        static createPrompt(rawText, promptTemplate) {
            const prompt = this.getPromptTemplate(promptTemplate).trimEnd();
            const text = String(rawText || '').trim();
            return `${prompt}\n${text}`;
        }

        static createChatCompletionRequest(config, rawText) {
            const safeConfig = { ...this.getDefaultConfig(), ...(config || {}) };
            const headers = { 'Content-Type': 'application/json' };
            if (safeConfig.apiKey) {
                headers.Authorization = `Bearer ${safeConfig.apiKey}`;
            }

            const body = {
                model: safeConfig.model || this.getDefaultConfig().model,
                temperature: 0.35,
                messages: [
                    {
                        role: 'system',
                        content: '你是专业的小红书文案与文字卡片编辑。请严格按用户提供的提示词输出适合卡片排版的 Markdown，避免空白页、过长标题和无关解释。'
                    },
                    {
                        role: 'user',
                        content: this.createPrompt(rawText, safeConfig.prompt)
                    }
                ]
            };

            return {
                url: this.normalizeEndpoint(safeConfig.endpoint),
                options: {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body)
                }
            };
        }

        static stripMarkdownFence(content) {
            const text = String(content || '').trim();
            const match = text.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/i);
            return (match ? match[1] : text).trim();
        }

        static extractMarkdown(responseData) {
            const content = responseData?.choices?.[0]?.message?.content
                || responseData?.choices?.[0]?.text
                || responseData?.output_text
                || '';
            return this.normalizeMarkdown(this.stripMarkdownFence(content));
        }

        static getDisplayWidth(text) {
            return Array.from(String(text || '')).reduce((total, char) => {
                return total + (/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(char) ? 2 : 1);
            }, 0);
        }

        static truncateDisplayText(text, maxWidth) {
            const value = String(text || '').trim().replace(/\s+/g, ' ');
            if (this.getDisplayWidth(value) <= maxWidth) return value;

            let width = 0;
            let result = '';
            for (const char of Array.from(value)) {
                const charWidth = this.getDisplayWidth(char);
                if (width + charWidth > maxWidth - 1) break;
                result += char;
                width += charWidth;
            }
            return `${result.trim()}…`;
        }

        static normalizeMarkdown(markdown) {
            const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
            const normalized = [];
            let seenH1 = false;
            let inFence = false;

            for (const rawLine of lines) {
                let line = rawLine.trimEnd();
                const trimmed = line.trim();

                if (/^```/.test(trimmed)) {
                    inFence = !inFence;
                    normalized.push(line);
                    continue;
                }

                if (!inFence && /^[-*_]{3,}$/.test(trimmed)) {
                    continue;
                }

                if (!trimmed) {
                    if (normalized.length > 0 && normalized[normalized.length - 1] !== '') {
                        normalized.push('');
                    }
                    continue;
                }

                if (!inFence) {
                    const heading = line.match(/^(#{1,6})\s+(.+)$/);
                    if (heading) {
                        let marks = heading[1];
                        const level = marks.length;
                        let title = heading[2].trim();

                        if (level === 1) {
                            if (seenH1) {
                                marks = '##';
                                title = this.truncateDisplayText(title, 26);
                            } else {
                                seenH1 = true;
                                title = this.truncateDisplayText(title, 30);
                            }
                        } else if (level === 2) {
                            title = this.truncateDisplayText(title, 24);
                        } else {
                            title = this.truncateDisplayText(title, 22);
                        }

                        line = `${marks} ${title}`;
                    }
                }

                normalized.push(line);
            }

            while (normalized[0] === '') normalized.shift();
            while (normalized[normalized.length - 1] === '') normalized.pop();
            return normalized.join('\n');
        }

        static async readErrorMessage(response) {
            try {
                if (typeof response.json === 'function') {
                    const data = await response.json();
                    return data?.error?.message || data?.message || JSON.stringify(data);
                }
            } catch (error) {}

            try {
                if (typeof response.text === 'function') {
                    return await response.text();
                }
            } catch (error) {}

            return '';
        }

        static async requestFormattedMarkdown(safeConfig, text, requestFetch) {
            const request = this.createChatCompletionRequest(safeConfig, text);
            const abortController = typeof AbortController !== 'undefined' ? new AbortController() : null;
            const timeoutMs = Number(safeConfig.timeoutMs) > 0 ? Number(safeConfig.timeoutMs) : this.DEFAULT_TIMEOUT_MS;
            let timeoutId = null;
            if (abortController) {
                request.options.signal = abortController.signal;
                timeoutId = setTimeout(() => abortController.abort(), timeoutMs);
            }

            try {
                const response = await requestFetch(request.url, request.options);
                if (!response.ok) {
                    const message = await this.readErrorMessage(response);
                    throw new Error(message || `AI 接口请求失败，HTTP ${response.status || 'unknown'}`);
                }

                const data = await response.json();
                const markdown = this.extractMarkdown(data);
                if (!markdown) throw new Error('AI 接口没有返回可用的 Markdown 内容。');
                return markdown;
            } catch (error) {
                if (error?.name === 'AbortError') {
                    throw new Error('AI 排版请求超时，请稍后重试。');
                }
                throw error;
            } finally {
                if (timeoutId) clearTimeout(timeoutId);
            }
        }

        static async formatText(config, rawText, fetchImpl) {
            const originalText = String(rawText || '');
            const text = originalText.trim();
            if (!text) throw new Error('请输入需要排版的文字。');
            if (originalText.length > this.MAX_INPUT_LENGTH) {
                throw new Error(`文字超过 ${this.MAX_INPUT_LENGTH.toLocaleString()} 字上限，请精简后重试。`);
            }

            const safeConfig = { ...this.getDefaultConfig(), ...(config || {}) };
            if (!safeConfig.endpoint) throw new Error('请填写 AI 接口地址。');
            if (!safeConfig.model) throw new Error('请填写模型名称。');

            const requestFetch = fetchImpl || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);
            if (!requestFetch) throw new Error('当前环境不支持 fetch 请求。');

            return this.requestFormattedMarkdown(safeConfig, text, requestFetch);
        }
    }

    return { AIFormatter };
});
