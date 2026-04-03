import os
import re

DASHBOARD_PATH = "pages/dashboard.css"
MODERATOR_PATH = "pages/Moderator/moderator.css"

def refactor_css(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # dashboard specific fixes
    if 'dashboard.css' in file_path:
        content = content.replace("background-color: var(--bg-dark-section);", "background-color: var(--bg-primary);")
        content = content.replace("color: white;", "color: var(--text-primary);")
        content = content.replace("background-color: #0a0a1a;", "background-color: var(--bg-card);")
    
    # Generic hex color mappings -> var()
    mappings = {
        r'rgba\(255,\s*255,\s*255,\s*0\.0[345]\)': 'var(--bg-card)',
        r'rgba\(255,\s*255,\s*255,\s*0\.08\)': 'var(--border)',
        r'rgba\(255,\s*255,\s*255,\s*0\.1\)': 'var(--border)',
        r'rgba\(0,\s*0,\s*0,\s*0\.2\)': 'var(--bg-card)',
        
        r'#111827': 'var(--bg-card)',
        r'#0f111a': 'var(--bg-card)',
        r'#0a0e1a': 'var(--bg-primary)',
        r'#e2e8f0': 'var(--text-primary)',
        r'#9ca3af': 'var(--text-secondary)',
        r'#94a3b8': 'var(--text-secondary)',
        r'#6b7280': 'var(--text-secondary)',
        r'#3b82f6': 'var(--accent)',
        r'#60a5fa': 'var(--accent)',
        r'rgba\(59,\s*130,\s*246,\s*0\.2\)': 'rgba(102, 126, 234, 0.2)',
        r'rgba\(59,\s*130,\s*246,\s*0\.1\)': 'rgba(102, 126, 234, 0.1)',
        r'#a855f7': 'var(--accent-secondary)',
        r'#9333ea': 'var(--accent-secondary)',
        r'#c084fc': 'var(--accent-pink)',
        r'#d8b4fe': 'var(--accent-pink)',
        
        # Moderator specific colors
        r'#ef4444': 'var(--accent-coral)',
        r'#f87171': 'var(--accent-coral)',
        r'rgba\(239,\s*68,\s*68,\s*0\.0[468]\)': 'rgba(245, 87, 108, 0.08)',
        r'#10b981': 'var(--accent-green)',
        r'#34d399': 'var(--accent-green)',
        r'#fbbf24': 'var(--accent-yellow)', # if doesn't exist, we will use plain hex or create it
    }

    for pattern, replacement in mappings.items():
        content = re.sub(pattern, replacement, content, flags=re.IGNORECASE)

    # Some remaining white text hardcodes:
    content = re.sub(r'color:\s*white;', 'color: var(--text-primary);', content)
    content = re.sub(r'color:\s*#fff;', 'color: var(--text-primary);', content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Refactored: {file_path}")

os.chdir(r"c:/Users/Asus-PC/myweb/frontend/src")
refactor_css(DASHBOARD_PATH)
refactor_css(MODERATOR_PATH)
