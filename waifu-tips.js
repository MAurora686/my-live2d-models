// 完整的 waifu-tips.js
(function(){
    // 显示消息函数
    function showMessage(text, timeout, priority) {
        if (!text || (sessionStorage.getItem('waifu-text') && sessionStorage.getItem('waifu-text') > priority)) return;
        if (messageTimer) {
            clearTimeout(messageTimer);
            messageTimer = null;
        }
        text = randomSelection(text);
        sessionStorage.setItem('waifu-text', priority);
        const tips = document.getElementById('waifu-tips');
        tips.innerHTML = text;
        tips.classList.add('waifu-tips-active');
        messageTimer = setTimeout(() => {
            sessionStorage.removeItem('waifu-text');
            tips.classList.remove('waifu-tips-active');
        }, timeout);
    }

    // 随机选择
    function randomSelection(obj) {
        return Array.isArray(obj) ? obj[Math.floor(Math.random() * obj.length)] : obj;
    }

    // 模型管理类
    class ModelManager {
        constructor(options) {
            this.cdnPath = options.cdnPath;
            this.isOrderSwitch = options.switchType === 'order';
        }

        async loadModelList() {
            const response = await fetch(`${this.cdnPath}model_list.json`);
            this.modelList = await response.json();
        }

        async loadModel(modelId, texturesId, message) {
            localStorage.setItem('modelId', modelId);
            localStorage.setItem('modelTexturesId', texturesId);
            
            if (!this.modelList) await this.loadModelList();
            
            showMessage(message, 4000, 10);
            
            const model = this.modelList.models[modelId][texturesId];
            if (model === undefined) {
                // 如果模型不存在，回退到默认模型
                if (parseInt(modelId) === 0 && parseInt(texturesId) === 0) return;
                await this.loadModel(0, 0, this.modelList.messages[0][0]);
                return;
            }
            
            // 加载模型 - 这是关键部分
            console.log('加载模型:', `${this.cdnPath}model/${model}/`);
            window.loadlive2d('live2d', `${this.cdnPath}model/${model}/`);
        }

        async switchTextures() {
            const modelId = localStorage.getItem('modelId');
            let texturesId = parseInt(localStorage.getItem('modelTexturesId'));
            
            if (!this.modelList) await this.loadModelList();
            const texturesCount = this.modelList.models[modelId].length;
            
            if (this.isOrderSwitch) {
                texturesId = (texturesId + 1) % texturesCount;
            } else {
                let randomId;
                do {
                    randomId = Math.floor(Math.random() * texturesCount);
                } while (randomId === texturesId);
                texturesId = randomId;
            }
            
            this.loadModel(modelId, texturesId, this.modelList.messages[modelId][texturesId]);
        }

        async switchModel() {
            let modelId = localStorage.getItem('modelId');
            if (!this.modelList) await this.loadModelList();
            
            modelId = parseInt(modelId) + 1 >= this.modelList.models.length ? 0 : parseInt(modelId) + 1;
            this.loadModel(modelId, 0, this.modelList.messages[modelId][0]);
        }
    }

    // 初始化看板娘
    window.initWidget = function(config) {
        const modelManager = new ModelManager(config);
        
        // 移除隐藏状态
        localStorage.removeItem('waifu-display');
        sessionStorage.removeItem('waifu-text');
        
        // 创建看板娘DOM
        document.body.insertAdjacentHTML('beforeend', `
            <div id="waifu">
                <div id="waifu-tips"></div>
                <canvas id="live2d" width="800" height="800"></canvas>
                <div id="waifu-tool"></div>
            </div>
        `);
        
        // 显示看板娘
        setTimeout(() => {
            document.getElementById('waifu').style.bottom = '0';
        }, 0);

        // 加载初始模型
        const modelId = localStorage.getItem('modelId') || 0;
        const texturesId = localStorage.getItem('modelTexturesId') || 0;
        
        new Promise((resolve) => {
            // 确保Live2D核心已加载
            if (window.live2d) {
                resolve();
            } else {
                // 如果live2d未加载，等待一下
                setTimeout(resolve, 1000);
            }
        }).then(() => {
            modelManager.loadModel(modelId, texturesId, '欢迎来到本站！');
        });

        // 添加工具栏等功能...
        console.log('看板娘初始化完成');
    };

})();
