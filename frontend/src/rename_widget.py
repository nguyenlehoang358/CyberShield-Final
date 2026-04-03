import os

def process_file(file_path, replacements):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    for old, new in replacements.items():
        content = content.replace(old, new)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

base_dir = r"c:\Users\Asus-PC\myweb\frontend\src\components\SupportChatWidget"

jsx_replacements = {
    'AIChatWidget': 'SupportChatWidget',
    'ai-chat': 'support-chat',
    'LAB AI Assistant': 'CyberShield Assistant',
    'Trợ lý ảo phòng LAB · RAG': 'Trợ lý ảo HTTT CyberShield',
    'Lab Virtual Assistant · RAG': 'CyberShield Virtual Assistant',
    'Tôi sử dụng **RAG** (Retrieval-Augmented Generation) để trả lời chính xác từ cơ sở tri thức LAB.': 'Tôi được thiết kế để hỗ trợ bạn tối đa trong việc trải nghiệm và sử dụng hệ thống CyberShield.',
    '• Hỏi về thiết bị & phần mềm\\n• Quy trình bảo mật & xử lý sự cố\\n• Công cụ: Wireshark, Nmap, Metasploit...\\n• Tài liệu kỹ thuật LAB': '• Hướng dẫn sử dụng hệ thống\\n• Xử lý sự cố kỹ thuật\\n• Trả lời FAQ\\n• Thông tin về CyberShield',
    'I use **RAG** (Retrieval-Augmented Generation) to answer accurately from the LAB knowledge base.': 'I am designed to assist you in experiencing and navigating the CyberShield system.',
    '• Equipment & software info\\n• Security procedures & incident response\\n• Tools: Wireshark, Nmap, Metasploit...\\n• LAB technical documentation': '• System usage guidelines\\n• Technical troubleshooting\\n• FAQ support\\n• CyberShield information',
    "body: JSON.stringify({ message: input, sessionId })": "body: JSON.stringify({ message: input, sessionId, mode: 'support' })",
    "Tấn công XSS là gì?": "Chức năng của CyberShield?",
    "Cách phòng chống SQLi": "Cách vào Admin Dashboard?",
    "Quét lỗ hổng Nmap": "Làm sao để đổi mật khẩu?",
    "What is XSS attack?": "What is CyberShield?",
    "How to prevent SQLi": "How to access Admin?",
    "Nmap vulnerability scan": "How to reset password?",
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" /></svg>': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
    '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" /><line x1="10" y1="22" x2="14" y2="22" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /><path d="M9.5 13a3.5 3.5 0 0 0 5 0" /></svg>': '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" /></svg>': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>'
}

css_replacements = {
    'ai-chat': 'support-chat',
    'var(--lab-blue)': 'var(--accent)',
    'var(--lab-cyan)': 'var(--accent-secondary)'
}

process_file(os.path.join(base_dir, 'SupportChatWidget.jsx'), jsx_replacements)
process_file(os.path.join(base_dir, 'SupportChatWidget.css'), css_replacements)
print('SupportChatWidget files processed.')
