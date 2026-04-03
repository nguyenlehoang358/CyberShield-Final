export const ctfChallenges = [
    {
        id: 'sanity-check',
        title: 'Sanity Check',
        category: 'Misc',
        points: 50,
        desc: 'Chào mừng bạn đến với MyWeb CTF! Flag nằm ngay đây: CTF{welcome_to_myweb_ctf}',
        hint: 'Copy và paste thôi.',
        flagHash: 'e6a8d7a1c2b3e4f5...' // Not used for this one as it's visible, but good practice
    },
    {
        id: 'web-inspector',
        title: 'Inspector Gadget',
        category: 'Web',
        points: 100,
        desc: 'Có một flag bị giấu trong HTML comment của trang này. Bạn có tìm thấy nó không?',
        hint: 'F12 hoặc click chuột phải -> Inspect Element.',
        // Real flag: CTF{html_comments_are_not_secret}
        flagHash: '8b3c37a4e6d8f9g0...'
    },
    {
        id: 'cookie-monster',
        title: 'Cookie Monster',
        category: 'Web',
        points: 150,
        desc: 'Admin rất thích bánh quy. Hãy kiểm tra xem admin có để lại mẩu bánh nào không?',
        hint: 'Kiểm tra Application > Cookies trong DevTools.',
        // Real flag: CTF{cookies_tast_good}
        flagHash: '...'
    },
    {
        id: 'base64-decoder',
        title: 'Basic Encoding',
        category: 'Crypto',
        points: 100,
        desc: 'Dịch đoạn mã sau: Q1RGe2Jhc2U2NF9pc19ub3RfZW5jcnlwdGlvbn0=',
        hint: 'Đây là Base64 encoding.',
        // Real flag: CTF{base64_is_not_encryption}
        flagHash: '...'
    }
]
