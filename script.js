class JavaScriptObfuscator {
    constructor() {
        this.worker = null;
        this.initWorker();
        this.setupEventListeners();
    }

    initWorker() {
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
                let obfuscated = code;
                
                if (options.compact) {
                    obfuscated = obfuscated
                        .replace(/\\/\\*[\\s\\S]*?\\*\\/|([^\\\\:]|^)\\/\\/.*$/gm, '$1')
                        .replace(/\\s+/g, ' ')
                        .trim();
                }
                
                if (options.stringArray) {
                    obfuscated = obfuscateStrings(obfuscated, options.stringArrayThreshold);
                }
                
                if (options.mangle) {
                     obfuscated = mangleVariables(obfuscated);
                }
                
                if (options.controlFlow) {
                    obfuscated = obfuscateControlFlow(obfuscated);
                }
                
                if (options.deadCode) {
                    obfuscated = injectDeadCode(obfuscated);
                }
                
                if (options.debugProtection) {
                    obfuscated = addDebugProtection(obfuscated);
                }
                
                return obfuscated;
            }
            
            function obfuscateStrings(code, threshold) {
                const stringRegex = /(["'])(?:(?!\\1|\\\\).|\\\\.)*\\1|`(?:(?!`|\\\\|\\$\\{).|\\\\.)*`/g;

                const strings = [];
                
                code = code.replace(stringRegex, (match) => {
                    if (match.length > (threshold || 3)) { 
                        strings.push(match);
                        return \`_s[\${strings.length - 1}]\`;
                    }
                    return match;
                });
                
                if (strings.length > 0) {
                    // Pastikan _s (nama array string) tidak akan di-mangle nanti
                    const stringArrayCode = \`var _s=[\${strings.join(',')}];\\n\`;
                    return stringArrayCode + code;
                }
                
                return code;
            }
            
            function mangleVariables(code) {
                let varCount = 0;
                const varMap = new Map();
                
                const keywords = new Set([
                    'abstract', 'arguments', 'await', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue',
                    'debugger', 'default', 'delete', 'do', 'double', 'else', 'enum', 'eval', 'export', 'extends', 'false', 'final',
                    'finally', 'float', 'for', 'function', 'goto', 'if', 'implements', 'import', 'in', 'instanceof', 'int', 'interface',
                    'let', 'long', 'native', 'new', 'null', 'package', 'private', 'protected', 'public', 'return', 'short', 'static',
                    'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'true', 'try', 'typeof', 'var', 'void',
                    'volatile', 'while', 'with', 'yield',
                    
                    // Kata Kunci Class & Objek
                    'constructor', 'prototype', '__proto__', 'toString', 'valueOf', 'hasOwnProperty',
                    
                    // Global & Bawaan
                    'Array', 'Object', 'String', 'Number', 'Boolean', 'Function', 'Symbol', 'Date', 'Math', 'RegExp', 'JSON', 'Promise',
                    'window', 'document', 'navigator', 'location', 'localStorage', 'sessionStorage', 'console', 'alert',
                    'setTimeout', 'setInterval', 'getElementById', 'querySelector', 'querySelectorAll', 'addEventListener',
                    
                    // Properti & Metode Umum
                    'length', 'name', 'push', 'pop', 'shift', 'unshift', 'slice', 'splice', 'map', 'filter', 'reduce', 'forEach',
                    'join', 'split', 'replace', 'match', 'search', 'indexOf', 'lastIndexOf', 'startsWith', 'endsWith', 'includes',
                    'toLowerCase', 'toUpperCase', 'trim', 'log', 'warn', 'error', 'innerHTML', 'textContent', 'value', 'style', 
                    'className', 'id', 'src', 'href',
                    
                    // Nama array string kita
                    '_s'
                ]);

                const identifierRegex = /\\b[a-zA-Z_$][a-zA-Z0-9_$]*\\b/g;
                const identifiers = new Set();
                let match;

                while ((match = identifierRegex.exec(code)) !== null) {
                    if (!keywords.has(match[0])) {
                        identifiers.add(match[0]);
                    }
                }

                identifiers.forEach(name => {
                    varMap.set(name, \`_\${varCount.toString(36)}\`);
                    varCount++;
                });

                let mangledCode = code;
                varMap.forEach((newName, oldName) => {
                    const replaceRegex = new RegExp(\`\\\\b\${oldName}\\\\b\`, 'g');
                    mangledCode = mangledCode.replace(replaceRegex, newName);
                });

                return mangledCode;
            }
            
            function obfuscateControlFlow(code) {
                const obfuscationCode = \`
                    (function(){
                        var _0x = ['log', 'push', 'shift'];
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
                        var _0xdev = new Date();
                        debugger; 
                        if (new Date() - _0xdev > 100) {
                            console.log("Anti-Debug: Harap tutup developer tools.");
                        }
                    })();
                \\n\`;
                
                return debugProtection + code;
            }
        `;
    }

    setupEventListeners() {
        const obfuscateButton = document.getElementById('obfuscateButton');
        const clearButton = document.getElementById('clearButton');
        const loadButton = document.getElementById('loadButton');
        const copyButton = document.getElementById('copyButton');
        
        const inputCode = document.getElementById('inputCode');
        const outputCode = document.getElementById('outputCode');

        if (obfuscateButton) {
            obfuscateButton.addEventListener('click', this.obfuscate.bind(this));
        }
        if (clearButton) {
            clearButton.addEventListener('click', this.clear.bind(this));
        }
        if (loadButton) {
            loadButton.addEventListener('click', this.loadExample.bind(this));
        }
        if (copyButton) {
            copyButton.addEventListener('click', this.copy.bind(this));
        }

        if (inputCode) {
            inputCode.addEventListener('input', () => {
                document.getElementById('inputCount').textContent = inputCode.value.length;
            });
        }
        if (outputCode) {
            outputCode.addEventListener('input', () => {
                document.getElementById('outputCount').textContent = outputCode.value.length;
            });
        }
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
            debugProtection: document.getElementById('debugProtection').value === 'true',
            mangle: document.getElementById('mangle').value === 'true'
        };

        this.updateStatus('Memproses obfuscation...', 'working');
        
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
        
        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                if (statusElement.textContent === message) {
                    statusElement.textContent = '';
                    statusElement.className = 'status';
                }
            }, 3000);
        }
    }
    
    clear() {
        document.getElementById('inputCode').value = '';
        document.getElementById('outputCode').value = '';
        document.getElementById('inputCount').textContent = '0';
        document.getElementById('outputCount').textContent = '0';
        this.updateStatus('', ''); // Hapus status
    }

    loadExample() {
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

        const inputCode = document.getElementById('inputCode');
        inputCode.value = exampleCode;
        document.getElementById('inputCount').textContent = exampleCode.length;
        this.clear();
        inputCode.value = exampleCode; // Setel ulang input
        document.getElementById('inputCount').textContent = exampleCode.length;
    }

    copy() {
        const outputCode = document.getElementById('outputCode');
        
        if (!outputCode.value.trim()) {
            this.updateStatus('Tidak ada kode untuk dicopy!', 'error');
            return;
        }

        outputCode.select();
        outputCode.setSelectionRange(0, 99999); // For mobile devices

        try {
            navigator.clipboard.writeText(outputCode.value).then(() => {
                this.updateStatus('Kode berhasil disalin ke clipboard!', 'success');
            });
        } catch (err) {
            try {
                document.execCommand('copy');
                this.updateStatus('Kode berhasil disalin ke clipboard!', 'success');
            } catch (fallbackErr) {
                this.updateStatus('Gagal menyalin kode!', 'error');
            }
        }
    }

    destroy() {
        if (this.worker) {
            this.worker.terminate();
        }
    }
}

// --- PERBAIKAN ---
// Inisialisasi class setelah DOM siap
document.addEventListener('DOMContentLoaded', () => {
    const obfuscator = new JavaScriptObfuscator();
    
    // Cleanup when page unloads
    window.addEventListener('beforeunload', () => {
        obfuscator.destroy();
    });
});