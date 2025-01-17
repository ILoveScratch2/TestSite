class BetterTranslate {
    constructor(runtime) {
        this.runtime = runtime;
        this._formatMessage = runtime.getFormatMessage({
            'zh-cn': {
                'BetterTranslate.extensionName': '更好的翻译',
                'BetterTranslate.translate': '使用[SERVICE]翻译[TEXT]从[FROM]到[TO]',
                'BetterTranslate.setApiKey': '设置[SERVICE]的API密钥为[KEY]',
                'BetterTranslate.detectLanguage': '检测文本[TEXT]的语言',
            },
            en: {
                'BetterTranslate.extensionName': 'Better Translate',
                'BetterTranslate.translate': 'translate[TEXT]from[FROM]to[TO]using[SERVICE]',
                'BetterTranslate.setApiKey': 'set[SERVICE]API key to[KEY]',
                'BetterTranslate.detectLanguage': 'detect language of[TEXT]',
            }
        });

        this.apiKeys = {
            DEEPL: ''
        };

        // 支持的语言代码
        this.languageCodes = {
            '简体中文': 'zh',
            '英语': 'en',
            '日语': 'ja',
            '韩语': 'ko',
            '法语': 'fr',
            '德语': 'de',
            '西班牙语': 'es',
            '俄语': 'ru'
        };
    }

    formatMessage(id) {
        return this._formatMessage({
            id,
            default: id,
            description: id
        });
    }

    getInfo() {
        return {
            id: 'betterTranslate',
            name: this.formatMessage('BetterTranslate.extensionName'),
            color1: '#4C97FF',
            blocks: [
                {
                    opcode: 'translate',
                    blockType: 'reporter',
                    text: this.formatMessage('BetterTranslate.translate'),
                    arguments: {
                        SERVICE: {
                            type: 'string',
                            menu: 'serviceMenu',
                            defaultValue: 'Microsoft'
                        },
                        TEXT: {
                            type: 'string',
                            defaultValue: 'Hello World'
                        },
                        FROM: {
                            type: 'string',
                            menu: 'languageMenu',
                            defaultValue: '英语'
                        },
                        TO: {
                            type: 'string',
                            menu: 'languageMenu',
                            defaultValue: '简体中文'
                        }
                    }
                },
                {
                    opcode: 'setApiKey',
                    blockType: 'command',
                    text: this.formatMessage('BetterTranslate.setApiKey'),
                    arguments: {
                        SERVICE: {
                            type: 'string',
                            menu: 'serviceMenu',
                            defaultValue: 'DeepL'
                        },
                        KEY: {
                            type: 'string',
                            defaultValue: ''
                        }
                    }
                },
                {
                    opcode: 'detectLanguage',
                    blockType: 'reporter',
                    text: this.formatMessage('BetterTranslate.detectLanguage'),
                    arguments: {
                        TEXT: {
                            type: 'string',
                            defaultValue: 'Hello World'
                        }
                    }
                }
            ],
            menus: {
                serviceMenu: {
                    items: ['Microsoft', 'DeepL', 'Google', 'Youdao']
                },
                languageMenu: {
                    items: Object.keys(this.languageCodes)
                }
            }
        };
    }

    async translate(args) {
        const text = args.TEXT;
        const service = args.SERVICE;
        const from = this.languageCodes[args.FROM];
        const to = this.languageCodes[args.TO];

        try {
            switch (service) {
                case 'Microsoft':
                    return await this._translateMicrosoft(text, from, to);
                case 'DeepL':
                    return await this._translateDeepL(text, from, to);
                case 'Google':
                    return await this._translateGoogle(text, from, to);
                case 'Youdao':
                    return await this._translateYoudao(text, from, to);
                default:
                    return '不支持的翻译服务';
            }
        } catch (error) {
            return `翻译错误: ${error.message}`;
        }
    }

    setApiKey(args) {
        const service = args.SERVICE.toUpperCase();
        const key = args.KEY;
        if (this.apiKeys.hasOwnProperty(service)) {
            this.apiKeys[service] = key;
            return true;
        }
        return false;
    }

    async detectLanguage(args) {
        const text = args.TEXT;
        try {
            // 使用有道翻译API检测语言
            const response = await fetch(`https://fanyi.youdao.com/translate?&doctype=json&type=AUTO&i=${encodeURIComponent(text)}`);
            const data = await response.json();
            return data.type.split('2')[0];
        } catch (error) {
            return '语言检测失败';
        }
    }

    async _translateMicrosoft(text, from, to) {
        try {
            const response = await fetch(`https://api.microsofttranslator.com/v2/ajax.svc/Translate?appId=&text=${encodeURIComponent(text)}&from=${from}&to=${to}`);
            const data = await response.text();
            // 移除返回数据中的引号
            return data.slice(1, -1);
        } catch (error) {
            throw new Error('Microsoft翻译服务暂时不可用');
        }
    }

    async _translateDeepL(text, from, to) {
        if (!this.apiKeys.DEEPL) {
            throw new Error('请先设置DeepL API密钥');
        }
        const response = await fetch('https://api-free.deepl.com/v2/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `DeepL-Auth-Key ${this.apiKeys.DEEPL}`
            },
            body: `text=${encodeURIComponent(text)}&source_lang=${from}&target_lang=${to}`
        });
        const data = await response.json();
        return data.translations[0].text;
    }

    async _translateGoogle(text, from, to) {
        try {
            const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`);
            const data = await response.json();
            return data[0][0][0];
        } catch (error) {
            throw new Error('Google翻译服务暂时不可用');
        }
    }

    async _translateYoudao(text, from, to) {
        try {
            const response = await fetch(`https://fanyi.youdao.com/translate?&doctype=json&type=AUTO&i=${encodeURIComponent(text)}`);
            const data = await response.json();
            return data.translateResult[0][0].tgt;
        } catch (error) {
            throw new Error('有道翻译服务暂时不可用');
        }
    }
}

window.tempExt = {
    Extension: BetterTranslate,
    info: {
        name: 'Better Translate'
    }
};
