import os
import re

files = [
    r'c:\Users\Asus-PC\myweb\frontend\src\components\SecurityAdvisor\SecurityAdvisor.css',
    r'c:\Users\Asus-PC\myweb\frontend\src\components\SecurityDashboard\SecurityDashboard.css'
]

replacements = [
    (r'color:\s*#e2e8f0;', 'color: var(--text-primary);'),
    (r'color:\s*#c9d1d9;', 'color: var(--text-primary);'),
    (r'color:\s*#94a3b8;', 'color: var(--text-secondary);'),
    (r'color:\s*#64748b;', 'color: var(--text-secondary);'),
    (r'color:\s*#475569;', 'color: var(--text-secondary);'),
    (r'color:\s*#cbd5e1;', 'color: var(--text-secondary);'),
    (r'background:\s*rgba\((15,\s*15,\s*30|30,\s*30,\s*50|8,\s*8,\s*20|15,\s*23,\s*42),\s*0\.\d\);', 'background: var(--bg-card);'),
    (r'background:\s*rgba\(20,\s*20,\s*40,\s*0\.8\);', 'background: var(--bg-card-hover);'),
    (r'background:\s*rgba\(255,\s*255,\s*255,\s*0\.02\);', 'background: var(--bg-card-hover);'),
    (r'background:\s*#0d1117;', 'background: var(--bg-card);'),
    (r'background:\s*#161b22;', 'background: var(--bg-card-hover);'),
    (r'border:\s*1px solid #30363d;', 'border: 1px solid var(--border-light);'),
    (r'border-bottom:\s*1px solid #30363d;', 'border-bottom: 1px solid var(--border-light);'),
    (r'border:\s*1px solid rgba\(255,\s*255,\s*255,\s*0\.1\);', 'border: 1px solid var(--border-light);'),
]

for fpath in files:
    if os.path.exists(fpath):
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        for pattern, repl in replacements:
            content = re.sub(pattern, repl, content)
            
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Processed {os.path.basename(fpath)}')
    else:
        print(f'File not found: {fpath}')
