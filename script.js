class JavaScriptObfuscator {
    constructor() {
        this.worker = null;
        this.initWorker();
        this.setupEventListeners();
    }

    initWorker() {
        // Buat worker dari blob URL
        const workerCode = this.getWorkerCode();
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.worker = new Worker(URL.createObjectURL(blob));

        this.worker.onmessage = (e) => {
            const { type, data, error } = e.data;
            
            if (type === 'obfuscated') {
                this.displayObfuscatedCode(data);
                this.updateStatus('Obfuscation berhasil!', 'success');
            } else if (type === 'error') {
                this.updateStatus(`Error: ${error}`, 'error');
            }
        };

        this.worker.onerror = (error) => {
            this.updateStatus(`Worker error: ${error.message}`, 'error');
        };
    }

    getWorkerCode() {
        return `
            self.onmessage = function(e) {
                const { code, options } = e.data;
                
                try {
                    const obfuscated = obfuscateCode(code, options);
                    self.postMessage({ type: 'obfuscated', data: obfuscated });
                } catch (error) {
                    self.postMessage({ type: 'error', error: error.message });
                }
            };

            function obfuscateCode(code, options) {
                // Simple obfuscation techniques
                let obfuscated = code;
                
                // Remove comments and extra whitespace if compact is enabled
                if (options.compact) {
                    obfuscated = obfuscated
                        .replace(/\\/\\*[\\s\\S]*?\\*\\/|([^\\\\:]|^)\\/\\/.*$/gm, '$1')
                        .replace(/\\s+/g, ' ')
                        .trim();
                }
                
                // Simple string obfuscation
                if (options.stringArray) {
                    obfuscated = obfuscateStrings(obfuscated, options.stringArrayThreshold);
                }
                
                // Variable name mangling
                obfuscated = mangleVariables(obfuscated);
                
                // Control flow obfuscation
                if (options.controlFlow) {
                    obfuscated = obfuscateControlFlow(obfuscated);
                }
                
                // Dead code injection
                if (options.deadCode) {
                    obfuscated = injectDeadCode(obfuscated);
                }
                
                // Debug protection
                if (options.debugProtection) {
                    obfuscated = addDebugProtection(obfuscated);
                }
                
                return obfuscated;
            }
            
            function obfuscateStrings(code, threshold) {
                const stringRegex = /(['"])(?:(?=(\\\\?))\\2.)*?\\1/g;
                const strings = [];
                
                // Collect all strings
                code = code.replace(stringRegex, (match) => {
                    strings.push(match);
                    return \`_s[\${strings.length - 1}]\`;
                });
                
                if (strings.length > 0) {
                    const stringArrayCode = \`var _s=[\${strings.join(',')}];\\n\`;
                    return stringArrayCode + code;
                }
                
                return code;
            }
            
            function mangleVariables(code) {
                let varCount = 0;
                const varMap = new Map();
                
                // Simple variable name replacement
                return code.replace(/\\b(var|let|const)\\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, 
                    (match, declaration, varName) => {
                        if (!varMap.has(varName)) {
                            varMap.set(varName, \`_\${varCount++}\`);
                        }
                        return \`\${declaration} \${varMap.get(varName)}\`;
                    }
                );
            }
            
            function obfuscateControlFlow(code) {
                // Add dummy control flow structures
                const obfuscationCode = \`
                    (function(){
                        var _0x = ['log'];
                        (function(_1, _2) {
                            var _3 = function(_4) {
                                while (--_4) {
                                    _1['push'](_1['shift']());
                                }
                            };
                            _3(++_2);
                        }(_0x, 0x1f4));
                    })();
                \\n\`;
                
                return obfuscationCode + code;
            }
            
            function injectDeadCode(code) {
                const deadCode = \`
                    if (false) {
                        console.log('This will never execute');
                        var _dummy = function() {
                            return Math.random() * 1000;
                        };
                    }
                \\n\`;
                
                return deadCode + code;
            }
            
            function addDebugProtection(code) {
                const debugProtection = \`
                    (function() {
                        var _debug = false;
                        try {
                            _debug = typeof console !== 'undefined' && console.log;
                        } catch (e) {}
                    })();
                \\n\`;
                
                return debugProtection + code;
            }
        `;
    }

    setupEventListeners() {
        const inputCode = document.getElementById('inputCode');
        inputCode.addEventListener('input', () => {
            document.getElementById('inputCount').textContent = inputCode.value.length;
        });

        const outputCode = document.getElementById('outputCode');
        outputCode.addEventListener('input', () => {
            document.getElementById('outputCount').textContent = outputCode.value.length;
        });
    }

    obfuscate() {
        const inputCode = document.getElementById('inputCode').value.trim();
        
        if (!inputCode) {
            this.updateStatus('Masukkan kode JavaScript terlebih dahulu!', 'error');
            return;
        }

        const options = {
            compact: document.getElementById('compact').value === 'true',
            controlFlow: document.getElementById('controlFlow').value === 'true',
            stringArray: document.getElementById('stringArray').value === 'true',
            stringArrayThreshold: parseFloat(document.getElementById('stringArrayThreshold').value),
            deadCode: document.getElementById('deadCode').value === 'true',
            debugProtection: document.getElementById('debugProtection').value === 'true'
        };

        this.updateStatus('Memproses obfuscation...', 'working');
        
        // Kirim kode ke worker untuk diproses
        this.worker.postMessage({
            code: inputCode,
            options: options
        });
    }

    displayObfuscatedCode(code) {
        const outputCode = document.getElementById('outputCode');
        outputCode.value = code;
        document.getElementById('outputCount').textContent = code.length;
    }

    updateStatus(message, type) {
        const statusElement = document.getElementById('status');
        statusElement.textContent = message;
        statusElement.className = `status ${type}`;
        
        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                statusElement.textContent = '';
                statusElement.className = 'status';
            }, 3000);
        }
    }

    destroy() {
        if (this.worker) {
            this.worker.terminate();
        }
    }
}

// Initialize the obfuscator
const obfuscator = new JavaScriptObfuscator();

// Global functions for buttons
function obfuscateCode() {
    obfuscator.obfuscate();
}

function clearCode() {
    document.getElementById('inputCode').value = '';
    document.getElementById('outputCode').value = '';
    document.getElementById('inputCount').textContent = '0';
    document.getElementById('outputCount').textContent = '0';
    document.getElementById('status').textContent = '';
    document.getElementById('status').className = 'status';
}

function loadExample() {
    const exampleCode = `// Contoh fungsi JavaScript
function calculateSum(a, b) {
    const result = a + b;
    console.log('Hasil penjumlahan:', result);
    return result;
}

// Contoh class
class Calculator {
    constructor() {
        this.history = [];
    }
    
    add(x, y) {
        const sum = x + y;
        this.history.push(\`\${x} + \${y} = \${sum}\`);
        return sum;
    }
    
    getHistory() {
        return this.history;
    }
}

// Penggunaan
const calc = new Calculator();
calculateSum(5, 3);
calc.add(10, 20);`;

    document.getElementById('inputCode').value = exampleCode;
    document.getElementById('inputCount').textContent = exampleCode.length;
}

function copyToClipboard() {
    const outputCode = document.getElementById('outputCode');
    
    if (!outputCode.value.trim()) {
        obfuscator.updateStatus('Tidak ada kode untuk dicopy!', 'error');
        return;
    }

    outputCode.select();
    outputCode.setSelectionRange(0, 99999); // For mobile devices

    try {
        navigator.clipboard.writeText(outputCode.value).then(() => {
            obfuscator.updateStatus('Kode berhasil disalin ke clipboard!', 'success');
        });
    } catch (err) {
        // Fallback for older browsers
        document.execCommand('copy');
        obfuscator.updateStatus('Kode berhasil disalin ke clipboard!', 'success');
    }
}

// Cleanup when page unloads
window.addEventListener('beforeunload', () => {
    obfuscator.destroy();
});
